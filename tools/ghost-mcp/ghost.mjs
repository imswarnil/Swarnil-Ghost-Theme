/*
 * A small Ghost Admin API client.
 *
 * Shared by the MCP server and scripts/deploy.mjs. Authentication is a
 * short-lived JWT signed with the second half of the Admin API key, which is
 * Ghost's documented scheme — built with node:crypto rather than a JWT library,
 * because the token is three base64url segments and a dependency that handles
 * credentials is one worth not having.
 *
 * No key or token is ever printed, including in error messages.
 */

import { createHmac } from 'node:crypto';

const b64url = (input) =>
	Buffer.from(input).toString('base64')
		.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

export const token = (adminKey) => {
	const [id, secret] = String(adminKey).split(':');
	if (!id || !secret) {
		throw new Error(
			'Admin API key is not in the expected "<id>:<secret>" form. Copy it whole ' +
			'from Ghost admin → Settings → Advanced → Integrations. Note that is the ' +
			'Admin key, not the Content key.',
		);
	}

	const now = Math.floor(Date.now() / 1000);
	const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: id }));
	// Five minutes: long enough for an upload, short enough that a leaked token
	// is worthless by the time anyone sees it.
	const payload = b64url(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' }));

	const signature = createHmac('sha256', Buffer.from(secret, 'hex'))
		.update(`${header}.${payload}`)
		.digest('base64')
		.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

	return `${header}.${payload}.${signature}`;
};

export const createClient = ({ url, adminKey, version = 'v6.0' }) => {
	const origin = String(url).replace(/\/+$/, '');

	const request = async (path, init = {}) => {
		const response = await fetch(`${origin}/ghost/api/admin${path}`, {
			...init,
			headers: {
				Authorization: `Ghost ${token(adminKey)}`,
				'Accept-Version': version,
				...init.headers,
			},
		});

		const text = await response.text();
		let body;
		try {
			body = text ? JSON.parse(text) : {};
		} catch {
			body = { raw: text.slice(0, 400) };
		}

		if (!response.ok) {
			const detail = body?.errors?.[0];
			throw new Error(
				`${response.status} ${response.statusText}` +
				(detail?.message ? ` — ${detail.message}` : '') +
				(detail?.context ? ` (${detail.context})` : ''),
			);
		}

		return body;
	};

	const json = (path, method, payload) =>
		request(path, {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});

	return { origin, request, json };
};
