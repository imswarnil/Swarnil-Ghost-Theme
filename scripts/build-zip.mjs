/*
 * Builds the buyer package: swarnil.zip.
 *
 * The zip is a product, not a snapshot of the repository. What goes in is
 * decided by an allow-list below rather than by excluding things, because the
 * failure mode of an exclude-list is shipping something private that nobody
 * remembered to add to it.
 *
 * The documentation ships as a single PDF at the root of the zip — not as the
 * docs/ folder, which is a website and has no business inside a Ghost theme.
 * The same content is live at theme.imswarnil.com/docs/, built from the same
 * Markdown, so the two cannot disagree; the PDF is what a buyer offline, or one
 * who bought a year ago, has in their hands.
 *
 * learn/ is not in the package either. The lessons are repository and website
 * content; a theme zip should contain a theme.
 *
 *   npm run zip
 */

import { execFile } from 'node:child_process';
import { access, readFile, rm, stat, copyFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { THEME_DIRS, THEME_FILES, EXTRA, EXCLUDE, templates } from './lib/shipping.mjs';

const run = promisify(execFile);
const ROOT = process.cwd();

const { name, version } = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));
const ZIP = join(ROOT, `${name}.zip`);

/* Everything a buyer receives, from the single list in lib/shipping.mjs — the
   same one gscan-staged.mjs validates, so the checked thing and the shipped
   thing cannot drift apart. docs.pdf is copied to the root just before zipping.

   The docs/ folder and learn/ are deliberately absent: a website and a set of
   lessons are repository content, not part of a Ghost theme. The documentation
   reaches a buyer as the PDF, and lives online at theme.imswarnil.com/docs/. */

console.log('Building the buyer package\n');

console.log('  stylesheet and script');
await run('npm', ['run', 'build'], { cwd: ROOT });

console.log('  documentation');
await run('npm', ['run', 'docs'], { cwd: ROOT });
await run('npm', ['run', 'docs:pdf'], { cwd: ROOT });

// Expanded by us: `zip` does not glob its input paths. See lib/shipping.mjs.
const hbs = await templates(ROOT);
if (!hbs.length) {
	console.error('No .hbs templates found — refusing to build an empty theme.');
	process.exit(1);
}
console.log(`  ${hbs.length} templates`);

// gscan is the gate. A zip that will not install is worse than no zip.
console.log('  validating with gscan');
try {
	// The staged validator, not `gscan .` — the development Ghost at .ghost/
	// would otherwise be scanned as part of the theme.
	await run(process.execPath, ['scripts/gscan-staged.mjs', '--fatal'], { cwd: ROOT });
} catch (error) {
	console.error('\ngscan failed — refusing to build the package.\n');
	console.error(error.stdout || error.message);
	process.exit(1);
}

// The PDF lives under docs/assets for the website; buyers get it at the root.
const PDF_SOURCE = join(ROOT, 'docs', 'assets', 'docs.pdf');
const PDF_TARGET = join(ROOT, 'docs.pdf');
let hasPdf = false;
try {
	await access(PDF_SOURCE, constants.R_OK);
	await copyFile(PDF_SOURCE, PDF_TARGET);
	hasPdf = true;
} catch {
	console.warn('  no docs.pdf (Chrome not found) — packaging without it');
}

await rm(ZIP, { force: true });

const args = [
	'-r', '-X', '-q',
	ZIP,
	...hbs,
	...THEME_DIRS,
	...THEME_FILES,
	...EXTRA,
	...(hasPdf ? ['docs.pdf'] : []),
	'-x', ...EXCLUDE,
];

await run('zip', args, { cwd: ROOT, shell: false });

if (hasPdf) await rm(PDF_TARGET, { force: true });

const { size } = await stat(ZIP);
const { stdout } = await run('unzip', ['-l', ZIP], { cwd: ROOT });
const entries = stdout.trim().split('\n');

/* Check the archive, not the directory it came from. gscan validated the
   working tree earlier; this confirms that what actually got packed is a
   complete theme. */
const packed = entries.join('\n');
const REQUIRED = ['default.hbs', 'index.hbs', 'post.hbs', 'package.json', 'assets/built/index.css'];
const missing = REQUIRED.filter((f) => !packed.includes(f));
if (missing.length) {
	console.error(`\nThe archive is missing: ${missing.join(', ')}`);
	process.exit(1);
}

console.log(`\n${name}.zip — ${(size / 1024).toFixed(0)} KB, ${entries.length - 5} files, v${version}`);
