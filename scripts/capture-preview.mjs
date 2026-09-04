/*
 * Captures the screenshots the documentation home page uses for its preview.
 *
 * Run against the local Ghost that has the demo content in it:
 *
 *   npm run docs:capture
 *
 * The results are committed. The public documentation cannot reach a machine's
 * localhost, and there is no hosted demo yet — so the preview block falls back
 * to these images. Once the demo is published, set DEMO_URL when building the
 * docs and the same block becomes a real embedded site instead.
 *
 * Chrome is found on the system rather than downloaded, for the same reason as
 * the PDF step: Puppeteer would add ~300 MB to do what the browser already here
 * does natively. Missing Chrome, or a Ghost that is not running, is a warning
 * rather than a failure — this is a convenience, not part of the theme.
 */

import { execFile } from 'node:child_process';
import { access, mkdir, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const ROOT = process.cwd();
const OUT_DIR = join(ROOT, 'docs', 'assets');

const BASE = process.env.PREVIEW_URL || 'http://localhost:2370';

const SHOTS = [
	{ path: '/', file: 'preview-home.png', width: 1600, height: 1000 },
	{ path: '/post-layouts/', file: 'preview-post.png', width: 1600, height: 1000 },
];

const CANDIDATES = [
	process.env.CHROME_PATH,
	'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
	'/Applications/Chromium.app/Contents/MacOS/Chromium',
	'/usr/bin/google-chrome',
	'/usr/bin/google-chrome-stable',
	'/usr/bin/chromium',
	'/usr/bin/chromium-browser',
].filter(Boolean);

const findChrome = async () => {
	for (const path of CANDIDATES) {
		try {
			await access(path, constants.X_OK);
			return path;
		} catch {
			/* next */
		}
	}
	return null;
};

const chrome = await findChrome();
if (!chrome) {
	console.warn('No Chrome or Chromium found — skipping preview capture.');
	process.exit(0);
}

try {
	const response = await fetch(BASE, { signal: AbortSignal.timeout(4000) });
	if (!response.ok) throw new Error(String(response.status));
} catch {
	console.warn(
		`Nothing answering at ${BASE} — skipping preview capture.\n` +
		'Start the preview Ghost first, or set PREVIEW_URL.',
	);
	process.exit(0);
}

await mkdir(OUT_DIR, { recursive: true });

for (const shot of SHOTS) {
	const out = join(OUT_DIR, shot.file);
	await run(chrome, [
		'--headless=new',
		'--disable-gpu',
		'--no-sandbox',
		'--hide-scrollbars',
		`--window-size=${shot.width},${shot.height}`,
		// Let webfonts settle and the header's scroll observer attach before the
		// frame is grabbed, or the capture can catch a half-styled page.
		'--virtual-time-budget=5000',
		`--screenshot=${out}`,
		`${BASE}${shot.path}`,
	], { timeout: 60_000 });

	const { size } = await stat(out);
	console.log(`docs/assets/${shot.file} — ${(size / 1024).toFixed(0)} KB`);
}
