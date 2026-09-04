/*
 * Swarnil — theme entry point.
 *
 * Everything here is progressive enhancement. The theme is fully readable and
 * navigable with JavaScript disabled: navigation is real links, pagination is
 * real pages, and the newsletter form posts normally. Nothing below is required
 * to reach content.
 *
 * Each module guards its own presence in the DOM, so a template that does not
 * use a feature costs nothing at runtime.
 */

import { initScheme } from './scheme.js';
import { initHeader } from './header.js';
import { initDrawer } from './drawer.js';
import { initToc } from './toc.js';
import { initChapters } from './chapters.js';

/*
 * Each module is started in isolation. They are independent enhancements, and
 * one of them throwing must not take the others down — a failure in the colour
 * scheme should never cost a reader the navigation drawer.
 */
const start = () => {
	[
		['scheme', initScheme],
		['header', initHeader],
		['drawer', initDrawer],
		['toc', initToc],
		['chapters', initChapters],
	].forEach(([name, init]) => {
		try {
			init();
		} catch (error) {
			// Surfaced rather than swallowed: silent failure is what makes this
			// class of bug expensive to find.
			console.error(`[theme] ${name} failed to start`, error);
		}
	});
};

// The script is loaded with `defer`, so the document is already parsed. The
// readyState check covers the case of it being moved into <head> without defer
// by a publisher's code injection.
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
	start();
}
