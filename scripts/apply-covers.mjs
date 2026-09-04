/*
 * Gives every post on a Ghost instance its generated cover image.
 *
 *   npm run covers -- --instance live
 *   npm run covers -- --instance local --force
 *
 * The artwork comes from demo/covers/<slug>.svg, drawn by build-demo-covers.mjs
 * from the same two-ramp palette as the theme. Flat SVG rather than photographs:
 * no licences to track, a few kilobytes each, and a demo whose images cannot go
 * out of date or belong to someone else.
 *
 * By default it skips any post that already has a feature image, so running it
 * twice is safe and it will never overwrite a real photograph someone chose.
 * --force replaces them.
 *
 * Every upload also sets feature_image_alt. A demo missing alt text is a demo
 * that fails the marketplace's own accessibility checklist on the first page a
 * reviewer opens.
 */

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { loadEnv } from './lib/env.mjs';
import { createClient } from '../tools/ghost-mcp/ghost.mjs';

const ROOT = process.cwd();
const COVERS = join(ROOT, 'demo', 'covers');

const args = process.argv.slice(2);
const value = (flag) => {
	const at = args.indexOf(flag);
	return at === -1 ? undefined : args[at + 1];
};
const instance = value('--instance') ?? 'local';
const force = args.includes('--force');

const env = await loadEnv(ROOT);
const target = {
	live: { url: env.get('API_URL'), key: env.get('ADMIN_API_KEY') },
	local: { url: env.get('LOCAL_API_URL') || 'http://localhost:2370', key: env.get('LOCAL_ADMIN_API_KEY') },
}[instance];

if (!target?.url || !target?.key) {
	console.error(`The "${instance}" instance is not configured in .env.`);
	process.exit(1);
}

let available;
try {
	available = new Set((await readdir(COVERS)).filter((f) => f.endsWith('.svg')));
} catch {
	console.error('No demo/covers — run `npm run demo:covers` first.');
	process.exit(1);
}

const ghost = createClient({ url: target.url, adminKey: target.key });

const { posts } = await ghost.request(
	'/posts/?limit=all&fields=id,title,slug,feature_image,updated_at&order=published_at%20asc',
);

console.log(`${posts.length} posts on ${ghost.origin}\n`);

let applied = 0;
let skipped = 0;

for (const post of posts) {
	const file = `${post.slug}.svg`;

	if (!available.has(file)) {
		console.log(`  no cover   ${post.slug}`);
		skipped += 1;
		continue;
	}

	if (post.feature_image && !force) {
		console.log(`  has image  ${post.slug}`);
		skipped += 1;
		continue;
	}

	const form = new FormData();
	form.append(
		'file',
		new Blob([await readFile(join(COVERS, file))], { type: 'image/svg+xml' }),
		file,
	);
	form.append('purpose', 'image');

	const upload = await ghost.request('/images/upload/', { method: 'POST', body: form });
	const url = upload.images[0].url;

	// updated_at is Ghost's collision check: without it a concurrent edit in the
	// admin UI would be silently overwritten.
	await ghost.json(`/posts/${post.id}/`, 'PUT', {
		posts: [{
			feature_image: url,
			feature_image_alt: `Abstract cover for “${post.title}”`,
			updated_at: post.updated_at,
		}],
	});

	console.log(`  set        ${post.slug}`);
	applied += 1;
}

console.log(`\n${applied} covered, ${skipped} skipped.`);
