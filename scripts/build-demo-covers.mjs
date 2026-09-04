/*
 * Generates the demo site's feature images.
 *
 * A theme demo needs pictures — a reviewer judges the media treatment before
 * they read a word — but shipping photographs means shipping licences, weight
 * and someone else's taste. These are drawn instead: flat SVG built from the
 * same two-ramp palette as the theme, one per lesson, deterministic from the
 * lesson's order number so regenerating produces identical files.
 *
 * They are demo assets, not theme assets. Nothing in assets/ references them and
 * they are excluded from the buyer zip.
 *
 *   npm run demo:covers
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.cwd();
const LEARN = join(ROOT, 'learn');
const OUT = join(ROOT, 'demo', 'covers');

const W = 1600;
const H = 900;

const INK = { bg: '#f1f1f4', line: '#d3d3db', deep: '#191922', mid: '#76768a' };
const SIGNAL = '#f04e2e';
const AMBER = '#d9a33a';

/* Six compositions, cycled by lesson number. Each is a different arrangement of
   the same three elements — rules, a circle, a rectangle — so the set reads as
   one series rather than six unrelated pictures. */
const compose = (n) => {
	const g = 100;
	const shapes = [
		`<circle cx="${W * 0.66}" cy="${H * 0.5}" r="${g * 2.2}" fill="${SIGNAL}"/>
		 <rect x="${g * 2}" y="${H * 0.5 - g}" width="${g * 4}" height="${g * 2}" fill="${INK.deep}"/>`,

		`<rect x="${W * 0.55}" y="${g}" width="${g * 5}" height="${H - g * 2}" fill="${INK.deep}"/>
		 <circle cx="${W * 0.55}" cy="${H * 0.5}" r="${g * 1.3}" fill="${SIGNAL}"/>`,

		`<path d="M ${g * 2} ${H - g * 2} L ${W * 0.5} ${g * 1.5} L ${W - g * 2} ${H - g * 2} Z" fill="${INK.deep}"/>
		 <circle cx="${W * 0.5}" cy="${H * 0.62}" r="${g}" fill="${SIGNAL}"/>`,

		`<rect x="${g * 2}" y="${g * 2}" width="${W - g * 4}" height="${H - g * 4}" fill="none" stroke="${INK.deep}" stroke-width="14"/>
		 <rect x="${W * 0.5}" y="${g * 2}" width="${W * 0.5 - g * 2}" height="${H - g * 4}" fill="${SIGNAL}"/>`,

		`<circle cx="${W * 0.38}" cy="${H * 0.5}" r="${g * 2.4}" fill="none" stroke="${INK.deep}" stroke-width="16"/>
		 <circle cx="${W * 0.62}" cy="${H * 0.5}" r="${g * 2.4}" fill="${SIGNAL}" opacity="0.92"/>`,

		`<rect x="${g * 2}" y="${H * 0.5 - g * 1.5}" width="${W - g * 4}" height="${g * 3}" fill="${INK.deep}"/>
		 <rect x="${W - g * 5}" y="${H * 0.5 - g * 1.5}" width="${g * 3}" height="${g * 3}" fill="${AMBER}"/>`,
	];
	return shapes[n % shapes.length];
};

const cover = (n, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${label}">
  <rect width="${W}" height="${H}" fill="${INK.bg}"/>

  <!-- The hairline grid the whole theme is built on, made literal. -->
  <g stroke="${INK.line}" stroke-width="2">
    ${Array.from({ length: 15 }, (_, i) => `<line x1="${(i + 1) * 100}" y1="0" x2="${(i + 1) * 100}" y2="${H}"/>`).join('\n    ')}
    ${Array.from({ length: 8 }, (_, i) => `<line x1="0" y1="${(i + 1) * 100}" x2="${W}" y2="${(i + 1) * 100}"/>`).join('\n    ')}
  </g>

  ${compose(n)}

  <!-- Deliberately no viewfinder brackets here. The theme draws its own over
       every framed image on hover, and a cover that also drew them produced two
       sets of corners a few pixels apart. The artwork stays plain and lets the
       component do the framing. -->

  <text x="110" y="${H - 110}" font-family="ui-monospace, monospace" font-size="72"
        fill="${INK.mid}" letter-spacing="8">${String(n).padStart(2, '0')}</text>
</svg>
`;

const files = (await readdir(LEARN)).filter((f) => /^\d+-.*\.md$/.test(f)).sort();
await mkdir(OUT, { recursive: true });

let written = 0;
for (const file of files) {
	const source = await readFile(join(LEARN, file), 'utf8');
	const order = Number(source.match(/^order:\s*(\d+)$/m)?.[1] ?? 0);
	const slug = source.match(/^slug:\s*(.+)$/m)?.[1].trim();
	const title = source.match(/^title:\s*(.+)$/m)?.[1].trim();
	if (!slug) continue;

	await writeFile(join(OUT, `${slug}.svg`), cover(order, `Abstract cover for: ${title}`));
	written += 1;
}

console.log(`demo/covers — ${written} covers`);
