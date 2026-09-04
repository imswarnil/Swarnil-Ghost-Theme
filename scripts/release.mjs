/*
 * Cuts a release: bump, changelog, commit, tag, push.
 *
 *   npm run release:patch     1.0.0 -> 1.0.1
 *   npm run release:minor     1.0.0 -> 1.1.0
 *   npm run release:major     1.0.0 -> 2.0.0
 *
 * Everything after the push is .github/workflows/release.yml.
 *
 * The refusals below are the point of the script. A release is the one action
 * in this project that cannot be taken back — the tag is public, the zip is
 * downloaded, and a buyer may already have it. So it declines to run on a dirty
 * tree, on the wrong branch, or with an empty Unreleased section, rather than
 * producing a release nobody can explain later.
 */

import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const ROOT = process.cwd();
const level = process.argv[2];

if (!['patch', 'minor', 'major'].includes(level)) {
	console.error('Usage: node scripts/release.mjs <patch|minor|major>');
	process.exit(1);
}

const git = async (...args) => (await run('git', args, { cwd: ROOT })).stdout.trim();

const fail = (message) => {
	console.error(`\n${message}\n`);
	process.exit(1);
};

/* ── Refuse to release from a state nobody can reconstruct ───────────────── */

if (await git('status', '--porcelain')) {
	fail(
		'The working tree has uncommitted changes.\n' +
		'A release must be reproducible from the tag alone — commit or stash first.',
	);
}

const branch = await git('rev-parse', '--abbrev-ref', 'HEAD');
if (branch !== 'main') {
	fail(`On branch ${branch}. Releases are cut from main.`);
}

await run('git', ['fetch', '--quiet', 'origin', 'main'], { cwd: ROOT });
if (await git('rev-list', 'HEAD..origin/main', '--count') !== '0') {
	fail('origin/main has commits you do not. Pull first.');
}

/* ── Work out the new version ────────────────────────────────────────────── */

const pkgPath = join(ROOT, 'package.json');
const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
const [major, minor, patch] = pkg.version.split('.').map(Number);

const next = {
	major: `${major + 1}.0.0`,
	minor: `${major}.${minor + 1}.0`,
	patch: `${major}.${minor}.${patch + 1}`,
}[level];

/* ── Move Unreleased into the new version ────────────────────────────────── */

const changelogPath = join(ROOT, 'CHANGELOG.md');
const changelog = await readFile(changelogPath, 'utf8');

const unreleased = changelog.match(/## \[Unreleased\]\n([\s\S]*?)(?=\n## \[)/);
if (!unreleased || !unreleased[1].trim()) {
	fail(
		'The Unreleased section of CHANGELOG.md is empty.\n' +
		'Write down what changed before releasing it — the release notes are\n' +
		'generated from that section, and a release with no notes is one nobody\n' +
		'can evaluate.',
	);
}

// Dates come from git rather than Date.now(), so a release cut from a machine
// with a skewed clock still records something checkable.
const today = (await git('log', '-1', '--format=%cs')) || '';

const updated = changelog.replace(
	'## [Unreleased]\n',
	`## [Unreleased]\n\n## [${next}] — ${today}\n`,
);

await writeFile(changelogPath, updated);

pkg.version = next;
await writeFile(pkgPath, `${JSON.stringify(pkg, null, '\t')}\n`);

/* ── Rebuild, so the committed assets carry the new version ──────────────── */

console.log(`Building ${next}…`);
await run('npm', ['run', 'build'], { cwd: ROOT });
await run('npm', ['run', 'docs'], { cwd: ROOT });

await run('git', ['add', '-A'], { cwd: ROOT });
await run('git', ['commit', '-m', `Release ${next}`], { cwd: ROOT });
await run('git', ['tag', '-a', `v${next}`, '-m', `Swarnil ${next}`], { cwd: ROOT });

console.log(
	`\nCommitted and tagged v${next}.\n\n` +
	'Nothing is public yet. To publish:\n\n' +
	`    git push origin main v${next}\n\n` +
	'That triggers the release workflow, which packages the zip, publishes the\n' +
	'GitHub Release, and hands off to the deploy workflow.',
);
