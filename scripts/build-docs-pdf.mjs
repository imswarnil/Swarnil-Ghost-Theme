/*
 * Prints docs/print.html to docs/assets/docs.pdf.
 *
 * The site is multipage; a PDF wants one continuous document. build-docs.mjs
 * therefore writes print.html — every section in order, from the same Markdown
 * and the same stylesheet as the pages, with the CSS inlined because this step
 * opens it as a local file. So the PDF is a real print of the published
 * documentation rather than a parallel rendering that can drift out of step.
 *
 * Chrome does the printing, and it is found on the system rather than
 * downloaded. Puppeteer would be the obvious choice, but it pulls ~300 MB into
 * devDependencies to do something the browser already on the machine — and on
 * every GitHub Actions runner — does natively.
 *
 * If no Chrome is found this exits 0 with a warning rather than failing. The
 * PDF is a convenience for buyers; it must not be able to block a release.
 *
 *   npm run docs:pdf
 */

import { execFile } from 'node:child_process';
import { access, mkdir, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const run = promisify(execFile);
const ROOT = process.cwd();
const SOURCE = join(ROOT, 'docs', 'print.html');
const OUT_DIR = join(ROOT, 'docs', 'assets');
const OUT = join(OUT_DIR, 'docs.pdf');

const CANDIDATES = [
	process.env.CHROME_PATH,
	'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
	'/Applications/Chromium.app/Contents/MacOS/Chromium',
	'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
	'/usr/bin/google-chrome',
	'/usr/bin/google-chrome-stable',
	'/usr/bin/chromium',
	'/usr/bin/chromium-browser',
	'/usr/bin/microsoft-edge',
].filter(Boolean);

const findChrome = async () => {
	for (const path of CANDIDATES) {
		try {
			await access(path, constants.X_OK);
			return path;
		} catch {
			/* try the next one */
		}
	}
	return null;
};

try {
	await access(SOURCE, constants.R_OK);
} catch {
	console.error('docs/print.html not found — run `npm run docs` first.');
	process.exit(1);
}

const chrome = await findChrome();

if (!chrome) {
	console.warn(
		'No Chrome, Chromium or Edge found — skipping docs.pdf.\n' +
		'Set CHROME_PATH to a browser binary to generate it.',
	);
	process.exit(0);
}

await mkdir(OUT_DIR, { recursive: true });

await run(chrome, [
	'--headless=new',
	'--disable-gpu',
	'--no-sandbox',
	'--no-pdf-header-footer',
	// The page is static, but give the renderer a moment to settle before
	// capture so the last section is never cut mid-layout.
	'--virtual-time-budget=4000',
	`--print-to-pdf=${OUT}`,
	pathToFileURL(SOURCE).href,
], { timeout: 60_000 });

const { size } = await stat(OUT);
console.log(`docs/assets/docs.pdf — ${(size / 1024).toFixed(0)} KB (via ${chrome.split('/').pop()})`);
