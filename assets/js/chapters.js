/*
 * Video chapters.
 *
 * On the video template, any list item in the post body that begins with a
 * timestamp — "01:24 Setting up the shot" — is lifted into the chapter list
 * beside the player and turned into a seek link.
 *
 * Authoring chapters as an ordinary list means they still make sense in the RSS
 * feed, in an email newsletter, and with this script disabled. Nothing about the
 * post depends on the theme to be readable.
 */

const STAMP = /^(\d{1,2}:)?(\d{1,2}):(\d{2})\s+(.*)$/;

const toSeconds = (hours, minutes, seconds) =>
	(Number(hours?.replace(':', '')) || 0) * 3600 +
	Number(minutes) * 60 +
	Number(seconds);

export const initChapters = () => {
	const target = document.querySelector('[data-chapters]');
	const source = document.querySelector('[data-chapters-source]');
	if (!target || !source) return;

	const player = document.querySelector('[data-video-player] iframe');
	const chapters = [];

	source.querySelectorAll('li').forEach((item) => {
		const match = item.textContent.trim().match(STAMP);
		if (match) {
			const [, hours, minutes, seconds, label] = match;
			chapters.push({
				stamp: item.textContent.trim().split(/\s+/)[0],
				seconds: toSeconds(hours, minutes, seconds),
				label,
			});
		}
	});

	if (!chapters.length) {
		target.remove();
		return;
	}

	chapters.forEach((chapter) => {
		const item = document.createElement('li');
		item.className = 'ghost-video__chapter';

		const stamp = document.createElement('span');
		stamp.className = 'ghost-video__stamp';
		stamp.textContent = chapter.stamp;

		const label = document.createElement('span');
		label.textContent = chapter.label;

		item.append(stamp, label);
		target.append(item);

		// Only YouTube and Vimeo expose a seek API we can reach across origins,
		// and only when the embed opts in. Without a player, the chapter list is
		// still a useful index — it just is not clickable.
		if (!player) return;

		item.classList.add('ghost-video__chapter--seekable');
		item.addEventListener('click', () => {
			const url = new URL(player.src);
			url.searchParams.set('start', String(chapter.seconds));
			url.searchParams.set('autoplay', '1');
			player.src = url.toString();
		});
	});
};
