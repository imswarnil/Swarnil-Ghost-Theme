/*
 * The Broadcast hero's background video.
 *
 * A publisher pastes a URL into one setting. Working out what that URL is — a
 * YouTube link in any of its four shapes, or a plain video file — is a
 * computer's job, not theirs, and Handlebars cannot parse a URL anyway. So the
 * template emits the raw string and this builds the right element.
 *
 * Three deliberate refusals:
 *
 *   · nothing loads when the reader has asked for reduced motion. A looping
 *     background video is decoration, and that setting exists for decoration.
 *   · nothing is ever unmuted. Sound that starts on its own is the single most
 *     hostile thing a website can do, and browsers block it regardless.
 *   · nothing loads until the hero is on screen, and it stops when it is not.
 *     A video nobody can see should not be costing anybody bandwidth.
 *
 * The poster — the publication cover, or the flat plate behind it — stays
 * visible underneath the whole time, so the hero never renders as a blank area
 * while the video is loading or when it never loads at all.
 */

const YOUTUBE = [
	/youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/,
	/youtu\.be\/([\w-]{11})/,
	/youtube\.com\/embed\/([\w-]{11})/,
	/youtube\.com\/shorts\/([\w-]{11})/,
];

const youtubeId = (url) => {
	for (const pattern of YOUTUBE) {
		const match = url.match(pattern);
		if (match) return match[1];
	}
	return null;
};

const buildYouTube = (id) => {
	const frame = document.createElement('iframe');
	const params = new URLSearchParams({
		autoplay: '1',
		mute: '1',
		controls: '0',
		loop: '1',
		// A YouTube loop needs the playlist to be the video itself; without it
		// the video plays once and stops on a related-videos screen.
		playlist: id,
		playsinline: '1',
		modestbranding: '1',
		rel: '0',
		showinfo: '0',
		disablekb: '1',
		fs: '0',
	});
	frame.src = `https://www.youtube-nocookie.com/embed/${id}?${params}`;
	frame.title = '';
	frame.setAttribute('aria-hidden', 'true');
	frame.setAttribute('tabindex', '-1');
	frame.allow = 'autoplay; encrypted-media';
	frame.frameBorder = '0';
	return frame;
};

const buildFile = (url) => {
	const video = document.createElement('video');
	video.src = url;
	video.autoplay = true;
	video.muted = true;
	video.loop = true;
	video.playsInline = true;
	video.setAttribute('aria-hidden', 'true');
	video.setAttribute('tabindex', '-1');
	// The poster underneath is already doing this job; loading it twice is
	// bandwidth for nothing.
	video.preload = 'none';
	return video;
};

export const initHeroVideo = () => {
	const container = document.querySelector('[data-hero-video]');
	if (!container) return;

	const url = container.dataset.heroVideo?.trim();
	if (!url) return;

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	let element = null;

	const load = () => {
		if (element) return;
		const id = youtubeId(url);
		element = id ? buildYouTube(id) : buildFile(url);
		element.className = 'ghost-hero__video-media';
		container.append(element);
		container.dataset.loaded = 'true';
	};

	const unload = () => {
		if (!element) return;
		element.remove();
		element = null;
		delete container.dataset.loaded;
	};

	// Only while the hero is actually on screen. Scrolling past a homepage
	// should not leave a video playing behind the rest of the page.
	const observer = new IntersectionObserver(
		([entry]) => {
			if (entry.isIntersecting) load();
			else unload();
		},
		{ rootMargin: '200px', threshold: 0 },
	);

	observer.observe(container);
};
