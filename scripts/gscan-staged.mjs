/*
 * Runs gscan against a staged copy of the theme, not the working directory.
 *
 * Why not just `gscan .`:
 *
 * The development Ghost lives at .ghost/ inside this folder, so that everything
 * for the product is in one place. Ghost requires the theme to appear at
 * contentPath/themes/<name>, which makes .ghost/content/themes/swarnil a
 * symlink back to the repository root — and `gscan .` walks into it and fails
 * with "Symlinks in themes are not allowed". It would also try to validate
 * Ghost core's own Handlebars files.
 *
 * Staging first is stricter in the way that matters: it validates the exact set
 * of files that ship, rather than whatever happens to be lying in the folder.
 *
 *   npm test          warnings shown, exit 0
 *   npm run test:ci   fatal, verbose
 */

import { execFile } from 'node:child_process';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { THEME_DIRS, THEME_FILES, templates } from './lib/shipping.mjs';

const run = promisify(execFile);
const ROOT = process.cwd();

const fatal = process.argv.includes('--fatal');
const stage = await mkdtemp(join(tmpdir(), 'swarnil-gscan-'));

try {
	const hbs = await templates(ROOT);
	if (!hbs.length) {
		console.error('No .hbs templates found — nothing to validate.');
		process.exit(1);
	}

	for (const entry of [...THEME_DIRS, ...THEME_FILES, ...hbs]) {
		await cp(join(ROOT, entry), join(stage, entry), {
			recursive: true,
			// Copying links as links would reintroduce the very thing this
			// script exists to avoid.
			dereference: true,
		});
	}

	const args = ['gscan', stage];
	if (fatal) args.push('--fatal', '--verbose');

	const { stdout } = await run('npx', args, { cwd: ROOT });
	console.log(stdout.replaceAll(stage, '.'));
} catch (error) {
	console.error((error.stdout || '').replaceAll(stage, '.') || error.message);
	process.exitCode = 1;
} finally {
	await rm(stage, { recursive: true, force: true });
}
