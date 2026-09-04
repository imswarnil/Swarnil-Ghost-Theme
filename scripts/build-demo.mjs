/*
 * Builds demo/content.json — a Ghost import file — from the lessons in learn/.
 *
 * The demo site's posts are the documentation. Writing them once and generating
 * both means the demo can never drift out of date, and it gives reviewers what
 * they actually need: content of real length and real variety, rather than five
 * identical lorem-ipsum cards.
 *
 * Feature images are deliberately not referenced here. A Ghost import file can
 * only point at URLs, and a portable one cannot assume any host. scripts/
 * seed-demo.mjs attaches locally generated covers after import, for the live
 * preview site.
 *
 *   npm run demo
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { marked } from 'marked';

const ROOT = process.cwd();
const LEARN = join(ROOT, 'learn');
const OUT = join(ROOT, 'demo');

// A fixed base date keeps regenerated output diffable: rebuilding the demo
// should show content changes, not a wall of new timestamps.
const BASE = Date.parse('2026-01-06T09:00:00.000Z');
const DAY = 86_400_000;

/* Minimal YAML front matter reader. The files are ours and the shape is fixed,
   so a full YAML parser would be a dependency earning nothing. */
const parseFrontMatter = (source, file) => {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!match) throw new Error(`${file}: missing front matter`);

	const meta = {};
	for (const line of match[1].split('\n')) {
		const pair = line.match(/^(\w+):\s*(.*)$/);
		if (!pair) continue;
		let value = pair[2].trim();
		if (value === 'true') value = true;
		else if (value === 'false') value = false;
		else if (value === 'null' || value === '') value = null;
		else if (/^\d+$/.test(value)) value = Number(value);
		else value = value.replace(/^["']|["']$/g, '');
		meta[pair[1]] = value;
	}

	return { meta, body: match[2] };
};

/* Ghost 6 stores post bodies as Lexical. A single `html` card is the honest way
   to import pre-rendered markup: it round-trips, it stays editable in the
   editor, and it does not pretend the content was authored block by block. */
const toLexical = (html) =>
	JSON.stringify({
		root: {
			children: [{ type: 'html', version: 1, html }],
			direction: 'ltr',
			format: '',
			indent: 0,
			type: 'root',
			version: 1,
		},
	});

/* Ghost import records are matched by id, so they only need to be unique and
   stable within this file — not globally. Deriving them from the slug keeps
   regenerated output identical. */
const idFor = (prefix, key) =>
	`${prefix}${[...key].reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 5381)
		.toString(16)
		.padStart(8, '0')}`.slice(0, 24).padEnd(24, '0');

const files = (await readdir(LEARN))
	.filter((name) => /^\d+-.*\.md$/.test(name))
	.sort();

const posts = [];
const tags = new Map();
const postsTags = [];
const postsAuthors = [];

const AUTHOR_ID = idFor('a', 'swarnil');

for (const file of files) {
	const { meta, body } = parseFrontMatter(await readFile(join(LEARN, file), 'utf8'), file);

	// Strip the leading H1 — Ghost renders the title itself, and printing it
	// twice is the single most common giveaway of imported content.
	const html = marked.parse(body.replace(/^#\s+.*\n/, ''));

	const id = idFor('p', meta.slug);
	const published = new Date(BASE + (meta.order - 1) * DAY * 3).toISOString();

	posts.push({
		id,
		title: meta.title,
		slug: meta.slug,
		lexical: toLexical(html),
		feature_image: null,
		featured: Boolean(meta.featured),
		type: 'post',
		status: 'published',
		visibility: 'public',
		custom_excerpt: meta.excerpt,
		custom_template: meta.template ? `custom-${meta.template}` : null,
		created_at: published,
		updated_at: published,
		published_at: published,
	});

	postsAuthors.push({ id: idFor('j', `${meta.slug}-author`), post_id: id, author_id: AUTHOR_ID });

	for (const name of [meta.tag, 'Learn'].filter(Boolean)) {
		const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
		if (!tags.has(slug)) {
			tags.set(slug, { id: idFor('t', slug), name, slug, description: null });
		}
		postsTags.push({
			id: idFor('x', `${meta.slug}-${slug}`),
			post_id: id,
			tag_id: tags.get(slug).id,
			sort_order: name === meta.tag ? 0 : 1,
		});
	}
}

/* Two pages, because a demo with no pages does not exercise page.hbs — and one
   of them is the layout index that lets a visitor reach every template the
   theme ships. */
/* Pages, because a demo with none never exercises page.hbs — and because the
   navigation the theme documents (Preview · Home · About · Blog · Contact)
   needs somewhere for three of those items to point. */
const page = (slug, title, excerpt, markdown) => ({
	id: idFor('p', slug),
	title,
	slug,
	lexical: toLexical(marked.parse(markdown)),
	feature_image: null,
	featured: false,
	type: 'page',
	status: 'published',
	visibility: 'public',
	custom_excerpt: excerpt,
	custom_template: null,
	created_at: new Date(BASE).toISOString(),
	updated_at: new Date(BASE).toISOString(),
	published_at: new Date(BASE).toISOString(),
});

const pages = [
	page('about', 'About', 'What this preview site is, and how to read it.', [
		'This site is the live preview for the **Swarnil** Ghost theme.',
		'',
		'Every post on it is a lesson about how Ghost themes work, so the demo',
		'content is the documentation. Nothing here is filler — the posts are the',
		'length real posts are, with real headings, code, tables and quotes.',
		'',
		'See [the preview index](/preview/) to jump straight to each template and',
		'layout the theme ships.',
	].join('\n')),

	page('preview', 'Preview', 'A live example of every template and layout the theme ships.', [
		'The theme ships several templates and a few layout switches. This page',
		'links to a live example of each, so nothing has to be taken on trust.',
		'',
		'## Homepage layouts',
		'',
		'- [With sidebar](/home/sidebar/) — topics, recent posts and the newsletter',
		'  in a second column',
		'- [Without sidebar](/home/full/) — the feed at full width',
		'',
		'The shape of the feed itself is a separate setting: Call Sheet, Stacked or',
		'Grid.',
		'',
		'## Post layouts',
		'',
		'- [Standard](/what-a-ghost-theme-is/) — the default reading layout',
		'- [Wide](/the-template-hierarchy/) — a broader column for image-led posts',
		'- [Immersive](/post-layouts/) — the title set over the feature image',
		'- [Video](/handlebars-in-ghost/) — player first, writing beside it',
		'',
		'## Listing pages',
		'',
		'- [Blog](/blog/) — every post, paginated',
		'- [Tag archive](/tag/handlebars/) — posts under one tag',
		'- [Author archive](/author/swarnil/) — posts by one author',
		'',
		'## Everything else',
		'',
		'- [A page](/about/) — no byline, no tags, no read-next',
		'- [Contact](/contact/) — a page with a form in it',
		'- [404](/this-page-does-not-exist/) — the error template',
	].join('\n')),

	page('contact', 'Contact', 'How to reach the publisher of this site.', [
		'The quickest way to reach me is email.',
		'',
		'For anything about the theme itself — a bug, a question, a licence —',
		'write to the address in the theme package and include your Ghost version',
		'and a link to the page that is wrong.',
		'',
		'## Elsewhere',
		'',
		'Ghost renders whatever you put on a page, so this one is deliberately',
		'plain: a page template with no byline, no tags and no read-next, which is',
		'exactly what a contact page should be.',
	].join('\n')),
];

const file = {
	db: [
		{
			meta: { exported_on: BASE, version: '6.0.0' },
			data: {
				posts: [...posts, ...pages],
				tags: [...tags.values()],
				posts_tags: postsTags,
				posts_authors: postsAuthors,
				users: [
					{
						id: AUTHOR_ID,
						name: 'Swarnil Singhai',
						slug: 'swarnil',
						email: 'swarnilsinghaicse@gmail.com',
						bio: 'Writes about Ghost, design systems and the craft of publishing on the web.',
						website: 'https://imswarnil.com',
						status: 'active',
					},
				],
			},
		},
	],
};

await mkdir(OUT, { recursive: true });
await writeFile(join(OUT, 'content.json'), `${JSON.stringify(file, null, 2)}\n`);

console.log(`demo/content.json — ${posts.length} posts, ${pages.length} pages, ${tags.size} tags`);
