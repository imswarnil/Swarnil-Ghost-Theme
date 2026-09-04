/*
 * Colour scheme: two modes, light and dark.
 *
 * The button flips between them and nothing else. A three-state control that
 * cycles system → light → dark reads as broken to most people: pressing it once
 * from "system" often changes nothing visible, because the system value already
 * matched. Two states always change something.
 *
 * The system preference still decides what a first-time visitor sees — it is
 * the starting point, just not a position on the switch. Once someone chooses,
 * the choice is remembered and the system stops being consulted.
 *
 * The value is applied to <html> before first paint by an inline script in
 * default.hbs; deferring it means a white flash on every navigation for anyone
 * reading in dark mode. This module only handles the button.
 */

const STORAGE_KEY = 'ghost-theme-scheme';

const systemPrefers = () =>
	window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const apply = (scheme) => {
	document.documentElement.setAttribute('data-theme', scheme);
};

export const initScheme = () => {
	const button = document.querySelector('[data-scheme-toggle]');
	const media = window.matchMedia('(prefers-color-scheme: dark)');

	let stored = null;
	try {
		stored = localStorage.getItem(STORAGE_KEY);
	} catch {
		/* storage blocked — the toggle still works for this page */
	}

	// Follow the system only until someone has expressed a preference.
	media.addEventListener('change', () => {
		let chosen = null;
		try {
			chosen = localStorage.getItem(STORAGE_KEY);
		} catch {
			/* as above */
		}
		if (!chosen) apply(systemPrefers());
	});

	if (!button) return;

	const label = (scheme) =>
		scheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

	const current = () =>
		document.documentElement.getAttribute('data-theme') || stored || systemPrefers();

	button.setAttribute('aria-label', label(current()));

	button.addEventListener('click', () => {
		const next = current() === 'dark' ? 'light' : 'dark';
		apply(next);
		button.setAttribute('aria-label', label(next));
		try {
			localStorage.setItem(STORAGE_KEY, next);
		} catch {
			/* not remembered, but applied */
		}
	});
};
