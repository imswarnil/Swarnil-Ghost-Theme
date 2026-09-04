/*
 * What counts as "the theme", in one place.
 *
 * Two scripts need this list and they must not drift: gscan-staged.mjs
 * validates it, build-zip.mjs packages it. When they disagree, the validated
 * thing and the shipped thing are different things — which is exactly how a zip
 * with no templates in it once passed every check.
 */

import { readdir } from 'node:fs/promises';

/* The theme proper: what Ghost loads and renders. */
export const THEME_DIRS = ['partials', 'assets'];
export const THEME_FILES = ['package.json', 'routes.yaml'];

/* Shipped to a buyer alongside the theme, but not part of it. gscan tolerates
   them; Ghost ignores them. */
export const EXTRA = ['demo', 'README.md', 'LICENSE'];

// Belt and braces for the archive — patterns excluded even if something above
// would otherwise sweep them in. The last one, a star-slash-dot-star glob,
// covers every dot-directory, including the development Ghost install at
// .ghost/ that lives inside this folder. It is written as a line comment
// because the glob itself contains a block-comment terminator.
export const EXCLUDE = [
	'*/node_modules/*',
	'*/.git/*',
	'*/.DS_Store',
	'.DS_Store',
	'*/abstract/*',
	'*.map',
	'*/.*',
];

/*
 * Root-level templates, found rather than globbed.
 *
 * `zip` does not expand globs in its input paths — that is normally the shell's
 * job, and these scripts run without one. Passing '*.hbs' produced an archive
 * containing no templates at all, which still passed gscan because gscan had
 * been pointed at the directory rather than at the archive.
 */
export const templates = async (root) =>
	(await readdir(root)).filter((f) => f.endsWith('.hbs')).sort();
