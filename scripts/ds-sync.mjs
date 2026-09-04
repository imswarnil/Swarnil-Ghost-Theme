/*
 * Puts the design system at .ds/, checked out at the exact commit recorded in
 * package.json → designSystem.ref.
 *
 * Why this exists
 * ---------------
 * The design system used to be a `file:` dependency on a sibling folder,
 * ../design.imswarnil.com. That folder is a working copy: it drifts, it can be
 * behind its own remote, and it is not present on a CI runner at all. The
 * result was a stylesheet that differed depending on where it was built —
 * locally it came out one way, on CI another, and the freshness check failed
 * with no visible cause. The sibling checkout turned out to be 33 commits
 * behind its remote.
 *
 * A compiled stylesheet is what ships to a buyer. It must not change because
 * somebody else's branch moved. So the version is pinned, and both the local
 * build and CI resolve it the same way: through this script.
 *
 *   npm run ds:sync    clone/checkout the pinned ref into .ds/
 *   npm run ds:link    point .ds/ at the sibling working copy instead, for
 *                      when you are editing the design system and the theme
 *                      together. Undo with ds:sync.
 *
 * .ds/ is gitignored. `prebuild` runs this, so an ordinary `npm run build`
 * cannot accidentally use whatever happens to be lying next door.
 */

import { execFile } from 'node:child_process';
import { access, lstat, readFile, rm, symlink } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const ROOT = process.cwd();
const DS = join(ROOT, '.ds');
const SIBLING = resolve(ROOT, '..', 'design.imswarnil.com');

const { designSystem } = JSON.parse(
	await readFile(join(ROOT, 'package.json'), 'utf8'),
);

if (!designSystem?.ref) {
	console.error('package.json has no designSystem.ref — nothing to pin to.');
	process.exit(1);
}

const exists = async (path) => {
	try {
		await access(path, constants.F_OK);
		return true;
	} catch {
		return false;
	}
};

/* ── ds:link — use the sibling working copy ──────────────────────────────── */
if (process.argv.includes('--link')) {
	if (!(await exists(SIBLING))) {
		console.error(`No design system beside this repository at ${SIBLING}`);
		process.exit(1);
	}
	await rm(DS, { recursive: true, force: true });
	await symlink(SIBLING, DS, 'dir');
	console.log(
		'.ds -> ../design.imswarnil.com (working copy)\n' +
		'The build now follows your local edits. Run `npm run ds:sync` to go back\n' +
		'to the pinned commit before committing assets/built.',
	);
	process.exit(0);
}

/* ── ds:sync — the pinned commit ─────────────────────────────────────────── */

// A symlink from a previous ds:link has to go before a clone can take its place.
if (await exists(DS)) {
	const stats = await lstat(DS);
	if (stats.isSymbolicLink()) {
		await rm(DS, { force: true });
	} else {
		const { stdout } = await run('git', ['-C', DS, 'rev-parse', 'HEAD']);
		if (stdout.trim() === designSystem.ref) {
			console.log(`design system already at ${designSystem.ref.slice(0, 12)}`);
			process.exit(0);
		}
	}
}

if (!(await exists(DS))) {
	await run('git', ['clone', '--quiet', '--no-checkout', designSystem.repository, DS]);
}

await run('git', ['-C', DS, 'fetch', '--quiet', 'origin']);
await run('git', ['-C', DS, 'checkout', '--quiet', '--force', designSystem.ref]);

console.log(`design system pinned at ${designSystem.ref.slice(0, 12)}`);
