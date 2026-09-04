/*
 * Header scroll state.
 *
 * Sets data-scrolled="true" on the header once the page has moved, which is
 * what turns the "Over Media" header into a solid plate and gives the "Plate"
 * header its shadow.
 *
 * An IntersectionObserver on a zero-height sentinel rather than a scroll
 * listener: no work happens on frames where nothing crossed the threshold.
 */

export const initHeader = () => {
	const header = document.querySelector('[data-header]');
	if (!header) return;

	const sentinel = document.createElement('div');
	sentinel.setAttribute('aria-hidden', 'true');
	sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px;';
	document.body.prepend(sentinel);

	const observer = new IntersectionObserver(
		([entry]) => {
			header.dataset.scrolled = String(!entry.isIntersecting);
		},
		{ threshold: 0 },
	);

	observer.observe(sentinel);
};
