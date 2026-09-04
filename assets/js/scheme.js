/*
 * Colour scheme.
 *
 * Three states cycled by one button: system → light → dark → system.
 *
 * The value is applied to <html> before first paint by an inline script in
 * default.hbs — it has to be inline and synchronous, or a reader who chose dark
 * gets a white flash on every navigation. This module only handles the button;
 * it never applies the initial value.
 *
 *   data-scheme  what the reader chose        (system | light | dark)
 *   data-theme   what is actually being shown (light | dark)
 *
 * They are separate because "system" is a choice, not an appearance, and the
 * design system's dark rules key off data-theme.
 */

const ORDER = ['system', 'light', 'dark'];
const STORAGE_KEY = 'ghost-theme-scheme';

const resolve = (scheme) => {
	if (scheme !== 'system') return scheme;
	return window.matchMedia('(prefers-color-scheme: dark)').matches
		? 'dark'
		: 'light';
};

const apply = (scheme) => {
	const root = document.documentElement;
	root.setAttribute('data-scheme', scheme);
	root.setAttribute('data-theme', resolve(scheme));
};

export const initScheme = () => {
	const button = document.querySelector('[data-scheme-toggle]');
	const media = window.matchMedia('(prefers-color-scheme: dark)');

	// Follow the OS while, and only while, the reader is on "system".
	media.addEventListener('change', () => {
		if (document.documentElement.getAttribute('data-scheme') === 'system') {
			apply('system');
		}
	});

	if (!button) return;

	button.addEventListener('click', () => {
		const current = document.documentElement.getAttribute('data-scheme') || 'system';
		const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];

		apply(next);

		// Private browsing and blocked storage both throw here. The toggle still
		// works for the current page; it just will not be remembered.
		try {
			localStorage.setItem(STORAGE_KEY, next);
		} catch {
			/* no persistence available */
		}

		button.setAttribute('aria-label', `Colour scheme: ${next}. Click to change.`);
	});
};
