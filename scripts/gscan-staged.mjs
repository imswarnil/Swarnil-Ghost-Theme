/*
 * Runs gscan against a staged copy of the theme, not the working directory.
 *
 * Why not just `gscan .`:
 *
 * `gscan .` validates the folder. This validates the deliverable — the exact
 * set of files build-zip.mjs packages, from the same list in lib/shipping.mjs.
 * The two are not the same check: a template missing from the package once
 * passed `gscan .` and produced a broken zip, because gscan had been pointed at
 * the working directory rather than at what shipped.
 *
 * `gscan .` still works and is worth running; it just cannot catch that.
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
