/*
 * Puts the design system at .ds/, at the exact commit recorded in
 * package.json → designSystem.ref.
 *
 * Why this exists
 * ---------------
 * The design system used to be a `file:` dependency on a sibling folder,
 * ../design.imswarnil.com. That folder is a working copy: it drifts, it can sit
 * behind its own remote, and a CI runner has no such sibling at all. The result
 * was a stylesheet that came out differently depending on where it was built,
 * and a freshness check that failed with no visible cause. The sibling checkout
 * turned out to be 33 commits behind its remote.
 *
 * A compiled stylesheet is what ships to a buyer. It must not change because
 * someone else's branch moved.
 *
 * Why a tarball rather than `git clone`
 * ------------------------------------
 * Cloning worked locally and failed on the runner with "unable to read tree" —
 * a nested clone inside a workspace that actions/checkout has already
 * configured is not the same operation as a clone on a clean machine. The
 * commit tarball has no such variables: it is one HTTP request for exactly the
 * tree we asked for, it needs no git at all, and it is faster for having no
 * history in it.
 *
 *   npm run ds:sync    fetch the pinned commit into .ds/
 *   npm run ds:link    point .ds/ at the sibling working copy instead, for when
 *                      the design system and the theme are being edited
 *                      together. Undo with ds:sync.
 *
 * .ds/ is gitignored, and `build:css` runs this first — so an ordinary build
 * cannot quietly use whatever happens to be lying next door.
 */

import { execFile } from 'node:child_process';
import { access, lstat, mkdir, mkdtemp, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const ROOT = process.cwd();
const DS = join(ROOT, '.ds');
const STAMP = join(DS, '.pinned-ref');
const SIBLING = resolve(ROOT, '..', 'design.imswarnil.com');

const { designSystem } = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));

if (!designSystem?.ref || !designSystem?.repository) {
	console.error('package.json needs designSystem.repository and designSystem.ref.');
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

/* ── ds:link — follow the sibling working copy ───────────────────────────── */
if (process.argv.includes('--link')) {
	if (!(await exists(SIBLING))) {
		console.error(`No design system beside this repository at ${SIBLING}`);
		process.exit(1);
	}
	await rm(DS, { recursive: true, force: true });
	await symlink(SIBLING, DS, 'dir');
	console.log(
		'.ds -> ../design.imswarnil.com (working copy)\n' +
		'The build now follows your local edits. Run `npm run ds:sync` before\n' +
		'committing assets/built, or the stylesheet will not match the pinned ref.',
	);
	process.exit(0);
}

/* ── ds:sync — the pinned commit ─────────────────────────────────────────── */

// A stamp file rather than git metadata, because the tarball carries no history
// to interrogate.
if (await exists(STAMP)) {
	const current = (await readFile(STAMP, 'utf8')).trim();
	if (current === designSystem.ref) {
		console.log(`design system already at ${designSystem.ref.slice(0, 12)}`);
		process.exit(0);
	}
}

// A symlink left by ds:link must go before a directory can take its place.
if (await exists(DS)) {
	const stats = await lstat(DS);
	await rm(DS, { recursive: !stats.isSymbolicLink(), force: true });
}

const slug = designSystem.repository
	.replace(/^https:\/\/github\.com\//, '')
	.replace(/\.git$/, '');
const url = `https://codeload.github.com/${slug}/tar.gz/${designSystem.ref}`;

const response = await fetch(url);
if (!response.ok) {
	console.error(`Could not fetch ${url} — ${response.status} ${response.statusText}`);
	console.error('Check designSystem.ref in package.json is a commit that exists on the remote.');
	process.exit(1);
}

const work = await mkdtemp(join(tmpdir(), 'ds-sync-'));
const tarball = join(work, 'ds.tar.gz');
await writeFile(tarball, Buffer.from(await response.arrayBuffer()));

// --strip-components=1 drops the "<repo>-<sha>/" wrapper the archive adds.
// The destination is created first rather than using --one-top-level, which
// GNU tar has and the bsdtar on macOS does not.
const extracted = join(work, 'ds');
await mkdir(extracted, { recursive: true });
await run('tar', ['-xzf', tarball, '-C', extracted, '--strip-components=1']);
await rename(extracted, DS);
await writeFile(STAMP, `${designSystem.ref}\n`);
await rm(work, { recursive: true, force: true });

console.log(`design system pinned at ${designSystem.ref.slice(0, 12)}`);
