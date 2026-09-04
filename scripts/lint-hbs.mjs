/*
 * A small Handlebars linter for the traps this theme has already hit once.
 *
 * gscan checks compatibility with Ghost's API; it does not catch helpers that
 * compile fine and then quietly do the wrong thing at runtime. Each rule below
 * corresponds to a bug that cost real debugging time, and the comment says why.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SKIP = new Set(['node_modules', '.git', '.ghost', 'assets', 'docs', 'demo', 'learn', 'abstract']);

const RULES = [
	{
		id: 'match-subexpression',
		// {{#match}} returns a SafeString object, never a boolean, when called as
		// a subexpression. An object is always truthy, so the condition around it
		// can never be false and the branch silently never fires.
		test: /\(\s*match\s/,
		message: '{{match}} used as a subexpression always returns a truthy object — use the block form {{#match a "b"}}…{{else}}…{{/match}}',
	},
	{
		id: 'block-helper-subexpression',
		// has / is / foreach are block-only. As subexpressions they throw
		// "options.inverse is not a function" at render time, which Ghost logs
		// and then swallows — the section just disappears from the page.
		test: /\(\s*(has|is|foreach)\s/,
		message: 'block-only helper used as a subexpression — it throws at render time and Ghost drops the section silently',
	},
	{
		id: 'url-helper-shadow',
		// Ghost registers `url` as a helper, and a helper beats a context
		// property of the same name. Inside a loop over @site.navigation that
		// makes every item link to the current page instead of its own target,
		// with nothing in the logs to say so. `this.url` reads the property.
		test: /@site\.(secondary_)?navigation[\s\S]*?(href="\{\{url|for=url\b)/,
		message: '{{url}} inside a navigation loop calls Ghost\'s url helper, not the item\'s url — write {{this.url}}',
	},
	{
		id: 'missing-alt',
		test: /<img(?![^>]*\balt=)[^>]*>/,
		message: '<img> without an alt attribute — required by the Ghost Marketplace accessibility checklist',
	},
];

const walk = async (dir) => {
	const out = [];
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		if (SKIP.has(entry.name)) continue;
		const full = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...(await walk(full)));
		else if (entry.name.endsWith('.hbs')) out.push(full);
	}
	return out;
};

const files = await walk(ROOT);
let failures = 0;

/*
 * Ghost's {{#get}} does not resolve async helpers inside its inverse branch, so
 * a {{#get}} nested in another {{#get}}'s {{else}} renders nothing and logs
 * nothing. Detecting that needs to know which block an {{else}} belongs to, so
 * this walks the block stack rather than pattern-matching text.
 */
const findGetInInverse = (code) => {
	const token = /\{\{#(\w+)|\{\{\/(\w+)|\{\{else\b/g;
	const stack = [];
	let match;

	while ((match = token.exec(code)) !== null) {
		const [text, open, close] = match;

		if (open) {
			stack.push({ name: open, inInverse: false });
		} else if (close) {
			stack.pop();
		} else {
			// {{else}} switches the innermost open block into its inverse branch.
			if (stack.length) stack[stack.length - 1].inInverse = true;
		}

		// A {{#get}} opened while any enclosing {{#get}} is in its inverse branch
		// is the broken case.
		if (open === 'get' && stack.slice(0, -1).some((b) => b.name === 'get' && b.inInverse)) {
			return match.index;
		}
	}

	return -1;
};

for (const file of files) {
	const source = await readFile(file, 'utf8');
	// Comments are where these patterns are explained, so they must not trip it.
	const code = source.replace(/\{\{!--[\s\S]*?--\}\}/g, '');

	for (const rule of RULES) {
		if (!rule.test.test(code)) continue;
		const line = code.slice(0, code.search(rule.test)).split('\n').length;
		console.error(`${relative(ROOT, file)}:${line}  [${rule.id}] ${rule.message}`);
		failures += 1;
	}

	const nested = findGetInInverse(code);
	if (nested !== -1) {
		const line = code.slice(0, nested).split('\n').length;
		console.error(
			`${relative(ROOT, file)}:${line}  [nested-get-in-inverse] ` +
			'{{#get}} inside another {{#get}}\'s {{else}} branch never renders — ' +
			'express the fallback as an `order` on one query, or use static markup',
		);
		failures += 1;
	}
}

if (failures) {
	console.error(`\n${failures} template problem${failures === 1 ? '' : 's'} found.`);
	process.exit(1);
}

console.log(`Checked ${files.length} templates — no known Handlebars traps.`);
