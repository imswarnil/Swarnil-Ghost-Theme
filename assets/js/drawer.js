/*
 * Mobile navigation drawer.
 *
 * A native <dialog>. showModal() gives focus trapping, Escape-to-close, and an
 * inert background for free — all of which would otherwise be a few hundred
 * lines of focus management to get wrong.
 *
 * That inert background is also why this module has to close the drawer when
 * the viewport grows: the drawer and its toggle only exist below 56rem, and a
 * dialog left open across that boundary would keep the whole page inert with
 * nothing on screen to explain it.
 */

const DESKTOP = '(min-width: 56rem)';

export const initDrawer = () => {
	const drawer = document.querySelector('[data-drawer]');
	const openers = document.querySelectorAll('[data-drawer-open]');
	const closers = document.querySelectorAll('[data-drawer-close]');

	if (!drawer || !openers.length) return;

	openers.forEach((button) => {
		button.addEventListener('click', () => {
			// Guard against a double-open, which throws InvalidStateError and
			// would take the rest of this module's listeners down with it.
			if (drawer.open) return;
			drawer.showModal();
			button.setAttribute('aria-expanded', 'true');
		});
	});

	closers.forEach((button) => {
		button.addEventListener('click', () => drawer.close());
	});

	// Clicking the backdrop. The dialog element fills only the panel, so any
	// click whose target is the dialog itself landed outside it.
	drawer.addEventListener('click', (event) => {
		if (event.target === drawer) drawer.close();
	});

	drawer.addEventListener('close', () => {
		openers.forEach((button) => button.setAttribute('aria-expanded', 'false'));
	});

	// Rotating a phone, or dragging a window wider, must not strand an open
	// drawer above the breakpoint where its close button no longer exists.
	const desktop = window.matchMedia(DESKTOP);
	desktop.addEventListener('change', (event) => {
		if (event.matches && drawer.open) drawer.close();
	});
};
