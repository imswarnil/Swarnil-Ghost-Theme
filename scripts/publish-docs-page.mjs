/*
 * Publishes the documentation as a page on a Ghost site.
 *
 *   npm run docs:publish -- --instance live
 *   npm run docs:publish -- --instance local
 *
 * theme.imswarnil.com is a Ghost site, not a static host, so the generated
 * multipage documentation cannot be served there — GitHub Pages would have to
 * own the domain, and it is already answering. The documentation therefore
 * exists twice, from one source:
 *
 *   docs/src/*.md  →  the multipage site  (GitHub Pages, search, per-page URLs)
 *                  →  this page at /docs/ (on the Ghost site itself)
 *                  →  docs.pdf            (in the buyer's zip)
 *
 * One page rather than several, because Ghost page slugs are flat: /docs/install/
 * would need a routes.yaml entry per section, uploaded by hand, and a buyer who
 * copied the theme would not have them. A single page with its own contents list
 * needs no routing and works on any Ghost.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { marked } from 'marked';
import { loadEnv } from './lib/env.mjs';
import { createClient } from '../tools/ghost-mcp/ghost.mjs';

const ROOT = process.cwd();
const SRC = join(ROOT, 'docs', 'src');

const args = process.argv.slice(2);
const at = args.indexOf('--instance');
const instance = at === -1 ? 'local' : args[at + 1];

const env = await loadEnv(ROOT);
const target = {
	live: { url: env.get('API_URL'), key: env.get('ADMIN_API_KEY') },
	local: { url: env.get('LOCAL_API_URL') || 'http://localhost:2370', key: env.get('LOCAL_ADMIN_API_KEY') },
}[instance];

if (!target?.url || !target?.key) {
	console.error(`The "${instance}" instance is not configured in .env.`);
	process.exit(1);
}

const { version } = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));

const slugify = (text) =>
	text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

const parse = (source) => {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	const meta = {};
	for (const line of match[1].split('\n')) {
		const pair = line.match(/^(\w+):\s*(.*)$/);
		if (pair) meta[pair[1]] = /^\d+$/.test(pair[2].trim()) ? Number(pair[2]) : pair[2].trim();
	}
	return { meta, body: match[2] };
};

const files = (await readdir(SRC)).filter((f) => f.endsWith('.md')).sort();
const sections = [];

for (const file of files) {
	const { meta, body } = parse(await readFile(join(SRC, file), 'utf8'));
	// Demote the sections' own headings by one, so the page's h2s are the
	// section titles and everything under them nests correctly.
	const demoted = body.replace(/^### /gm, '#### ').replace(/^## /gm, '### ');
	sections.push({ ...meta, html: marked.parse(demoted) });
}

sections.sort((a, b) => a.order - b.order);

const contents = sections
	.map((s) => `<li><a href="#${slugify(s.title)}">${s.title}</a> — ${s.summary}</li>`)
	.join('\n');

/* Written against the theme's own prose styles, so it looks like the rest of
   the site rather than like a document pasted into it. */
const html = `
<p><strong>Swarnil v${version}</strong> — documentation for the Ghost theme this
site is running. Everything below is generated from the same source as the PDF
in the theme package, so the two cannot disagree.</p>

<h2 id="contents">Contents</h2>
<ul>
${contents}
</ul>

${sections.map((s) => `
<hr>
<h2 id="${slugify(s.title)}">${s.title}</h2>
<p><em>${s.summary}</em></p>
${s.html}
`).join('\n')}
`.trim();

const ghost = createClient({ url: target.url, adminKey: target.key });

const fields = {
	title: 'Documentation',
	slug: 'docs',
	lexical: JSON.stringify({
		root: {
			children: [{ type: 'html', version: 1, html }],
			direction: 'ltr',
			format: '',
			indent: 0,
			type: 'root',
			version: 1,
		},
	}),
	status: 'published',
	custom_excerpt: `Install, settings, layouts and troubleshooting for the Swarnil theme, v${version}.`,
	show_title_and_feature_image: true,
};

const existing = await ghost.request(
	'/pages/?filter=' + encodeURIComponent('slug:docs') + '&limit=1&fields=id,updated_at',
);
const found = existing.pages?.[0];

if (found) {
	const body = await ghost.json(`/pages/${found.id}/`, 'PUT', {
		pages: [{ ...fields, updated_at: found.updated_at }],
	});
	console.log(`updated ${body.pages[0].url}`);
} else {
	const body = await ghost.json('/pages/', 'POST', { pages: [fields] });
	console.log(`created ${body.pages[0].url}`);
}

console.log(`${sections.length} sections, ${(html.length / 1024).toFixed(0)} KB of HTML`);
