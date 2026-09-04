/*
 * Table of contents.
 *
 * Built from the headings Ghost rendered, because the theme has no way to know
 * what they are until the post exists.
 *
 * Ghost adds an id to headings it renders from its own heading nodes, but not to
 * headings inside an HTML or Markdown card — and plenty of real posts contain
 * those. So any heading without an id gets one here, derived from its text. That
 * also makes the headings linkable, which they otherwise would not be.
 *
 * Deliberately gives up in two cases:
 *   · fewer than three headings — a contents list of two is decoration
 *   · the container is absent — the setting is off, or this is a page
 */

const MIN_HEADINGS = 3;

/* Mirrors Ghost's own heading-id style closely enough that anchors written by
   hand against editor-rendered posts keep working. */
const slugify = (text) =>
	text
		.trim()
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '') || 'section';

export const initToc = () => {
	const container = document.querySelector('[data-toc]');
	const content = document.querySelector('[data-toc-source]');
	if (!container || !content) return;

	const headings = [...content.querySelectorAll('h2, h3')];

	// Give anything unlabelled a stable, unique id before building the list.
	const used = new Set();
	headings.forEach((heading) => {
		if (!heading.id) {
			let id = slugify(heading.textContent);
			let n = 2;
			while (used.has(id) || document.getElementById(id)) {
				id = `${slugify(heading.textContent)}-${n}`;
				n += 1;
			}
			heading.id = id;
		}
		used.add(heading.id);
	});

	if (headings.length < MIN_HEADINGS) {
		container.remove();
		return;
	}

	const list = container.querySelector('[data-toc-list]');
	const links = headings.map((heading) => {
		const item = document.createElement('li');
		item.className =
			heading.tagName === 'H3'
				? 'ghost-toc__item ghost-toc__item--sub'
				: 'ghost-toc__item';

		const link = document.createElement('a');
		link.className = 'ghost-toc__link';
		link.href = `#${heading.id}`;
		link.textContent = heading.textContent;

		item.append(link);
		list.append(item);
		return link;
	});

	// Highlight the heading currently at the top of the viewport. The bottom
	// margin of -70% means a heading counts as "current" from the moment it
	// reaches the upper third of the screen until the next one does.
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) return;
				const id = entry.target.id;
				links.forEach((link) => {
					link.classList.toggle(
						'ghost-toc__link--current',
						link.hash === `#${id}`,
					);
				});
			});
		},
		{ rootMargin: '0px 0px -70% 0px', threshold: 0 },
	);

	headings.forEach((heading) => observer.observe(heading));
};
