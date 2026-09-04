/*
 * Documentation site behaviour.
 *
 * Hand-authored; scripts/build-docs.mjs copies it across unchanged.
 *
 * Everything here is enhancement. With JavaScript off the docs are still a set
 * of ordinary linked pages with working navigation and a table of contents —
 * the search button is the only thing that stops doing anything, and it is
 * hidden in that case.
 *
 * No dependencies and no build step: it is small enough to read, and a
 * documentation site that needs a bundler to explain a theme is telling on
 * itself.
 */

(() => {
	'use strict';

	/* ── Colour scheme ───────────────────────────────────────────────────────
	   The initial value is applied by an inline script in the page head, before
	   first paint. This only handles the button. */
	const initScheme = () => {
		const button = document.querySelector('[data-scheme-toggle]');
		if (!button) return;

		const order = ['system', 'light', 'dark'];
		const resolve = (scheme) =>
			scheme === 'system'
				? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
				: scheme;

		const apply = (scheme) => {
			const root = document.documentElement;
			root.dataset.scheme = scheme;
			if (scheme === 'system') root.removeAttribute('data-theme');
			else root.dataset.theme = resolve(scheme);
			button.setAttribute('aria-label', `Colour scheme: ${scheme}. Change it.`);
			button.querySelectorAll('[data-scheme-icon]').forEach((icon) => {
				icon.hidden = icon.dataset.schemeIcon !== scheme;
			});
		};

		apply(document.documentElement.dataset.scheme || 'system');

		button.addEventListener('click', () => {
			const current = document.documentElement.dataset.scheme || 'system';
			const next = order[(order.indexOf(current) + 1) % order.length];
			apply(next);
			try {
				localStorage.setItem('swarnil-docs-scheme', next);
			} catch {
				/* storage blocked — the choice just is not remembered */
			}
		});
	};

	/* ── Mobile navigation ──────────────────────────────────────────────────
	   A native <dialog>: focus trapping, Escape and background inertness come
	   from the platform rather than from a few hundred lines here. */
	const initDrawer = () => {
		const drawer = document.querySelector('[data-drawer]');
		const open = document.querySelector('[data-drawer-open]');
		if (!drawer || !open) return;

		open.addEventListener('click', () => {
			drawer.showModal();
			open.setAttribute('aria-expanded', 'true');
		});
		drawer.querySelectorAll('[data-drawer-close]').forEach((button) => {
			button.addEventListener('click', () => drawer.close());
		});
		drawer.addEventListener('click', (event) => {
			if (event.target === drawer) drawer.close();
		});
		drawer.addEventListener('close', () => {
			open.setAttribute('aria-expanded', 'false');
		});
	};

	/* ── In-page contents ───────────────────────────────────────────────────
	   The list is rendered at build time so it works without scripting; this
	   only marks which entry is current as the reader scrolls. */
	const initToc = () => {
		const links = [...document.querySelectorAll('[data-toc-link]')];
		if (!links.length) return;

		const targets = links
			.map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))))
			.filter(Boolean);
		if (!targets.length) return;

		const mark = (id) => {
			links.forEach((link) => {
				link.dataset.current = String(decodeURIComponent(link.hash.slice(1)) === id);
			});
		};

		// -70% at the bottom means a heading becomes current once it reaches the
		// upper third of the viewport, and stays current until the next one does.
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) mark(entry.target.id);
				});
			},
			{ rootMargin: '0px 0px -70% 0px', threshold: 0 },
		);

		targets.forEach((target) => observer.observe(target));
	};

	/* ── Live preview width ─────────────────────────────────────────────────
	   Changes the width of the frame rather than of anything inside it, so what
	   is on show is the theme's own responsive behaviour. */
	const initPreview = () => {
		const viewport = document.querySelector('[data-preview-viewport]');
		const buttons = [...document.querySelectorAll('[data-preview-width]')];
		if (!viewport || !buttons.length) return;

		buttons.forEach((button) => {
			button.addEventListener('click', () => {
				viewport.dataset.width = button.dataset.previewWidth;
				buttons.forEach((other) => {
					other.setAttribute('aria-pressed', String(other === button));
				});
			});
		});
	};

	/* ── Search ─────────────────────────────────────────────────────────────
	   The index is one JSON file built from the same Markdown as the pages, and
	   fetched on first open rather than on load. It is a few kilobytes; a search
	   library to query it would be larger than the thing being searched. */
	const initSearch = () => {
		const dialog = document.querySelector('[data-search]');
		const opener = document.querySelector('[data-search-open]');
		if (!dialog || !opener) return;

		opener.hidden = false;

		const input = dialog.querySelector('[data-search-input]');
		const output = dialog.querySelector('[data-search-results]');
		const base = document.documentElement.dataset.base || '';
		let index = null;
		let active = 0;

		const load = async () => {
			if (index) return index;
			try {
				const response = await fetch(`${base}search-index.json`);
				index = await response.json();
			} catch {
				index = [];
			}
			return index;
		};

		const escape = (text) =>
			text.replace(/[&<>"]/g, (c) =>
				({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

		// Show the match in context rather than the start of the section, so the
		// result explains why it matched.
		const excerpt = (text, term) => {
			const at = text.toLowerCase().indexOf(term);
			if (at === -1) return escape(text.slice(0, 110)) + '…';
			const from = Math.max(0, at - 40);
			const slice = text.slice(from, from + 130);
			const marked = escape(slice).replace(
				new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'),
				'<mark>$1</mark>',
			);
			return `${from > 0 ? '…' : ''}${marked}…`;
		};

		const render = (results, term) => {
			active = 0;
			if (!term) {
				output.innerHTML = '';
				return;
			}
			if (!results.length) {
				output.innerHTML = '<li class="search__empty">Nothing matches that.</li>';
				return;
			}
			output.innerHTML = results
				.map((entry, i) => `
					<li class="search__result" data-active="${i === 0}">
						<a href="${base}${entry.url}">
							<span class="search__result-title">${escape(entry.page)}${
								entry.heading ? ` · ${escape(entry.heading)}` : ''
							}</span>
							<span class="search__result-context">${excerpt(entry.text, term)}</span>
						</a>
					</li>`)
				.join('');
		};

		const search = async () => {
			const term = input.value.trim().toLowerCase();
			const entries = await load();
			if (!term) return render([], term);

			const scored = entries
				.map((entry) => {
					const haystack = `${entry.page} ${entry.heading} ${entry.text}`.toLowerCase();
					if (!haystack.includes(term)) return null;
					// A hit in a heading beats a hit in the body; an exact page-title
					// hit beats both.
					let score = 1;
					if (entry.heading.toLowerCase().includes(term)) score += 4;
					if (entry.page.toLowerCase().includes(term)) score += 6;
					return { entry, score };
				})
				.filter(Boolean)
				.sort((a, b) => b.score - a.score)
				.slice(0, 12)
				.map((row) => row.entry);

			render(scored, term);
		};

		const move = (delta) => {
			const items = [...output.querySelectorAll('.search__result')];
			if (!items.length) return;
			active = (active + delta + items.length) % items.length;
			items.forEach((item, i) => {
				item.dataset.active = String(i === active);
			});
			items[active].scrollIntoView({ block: 'nearest' });
		};

		const show = () => {
			dialog.showModal();
			input.value = '';
			output.innerHTML = '';
			input.focus();
			load();
		};

		opener.addEventListener('click', show);
		dialog.querySelectorAll('[data-search-close]').forEach((button) => {
			button.addEventListener('click', () => dialog.close());
		});
		dialog.addEventListener('click', (event) => {
			if (event.target === dialog) dialog.close();
		});
		input.addEventListener('input', search);

		input.addEventListener('keydown', (event) => {
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				move(1);
			} else if (event.key === 'ArrowUp') {
				event.preventDefault();
				move(-1);
			} else if (event.key === 'Enter') {
				const link = output.querySelector('[data-active="true"] a');
				if (link) {
					event.preventDefault();
					window.location.href = link.href;
				}
			}
		});

		document.addEventListener('keydown', (event) => {
			const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
			if ((event.key === '/' && !typing) || ((event.metaKey || event.ctrlKey) && event.key === 'k')) {
				event.preventDefault();
				show();
			}
		});
	};

	const start = () => {
		initScheme();
		initDrawer();
		initToc();
		initPreview();
		initSearch();
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', start, { once: true });
	} else {
		start();
	}
})();
