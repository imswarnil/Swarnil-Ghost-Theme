/*
 * Uploads this theme to a Ghost site and activates it.
 *
 *   npm run deploy
 *
 * Reads API_URL and ADMIN_API_KEY from .env, or from the environment. Nothing
 * else is needed — no SSH, no FTP, nothing installed on the server.
 *
 * Authentication is a short-lived JWT signed with the second half of the Admin
 * API key, which is Ghost's documented scheme. It is done with node:crypto
 * rather than a JWT library: the token is three base64url segments and a
 * signature, and a dependency that handles credentials is a dependency worth
 * not having.
 *
 * The token lives for five minutes and is never written anywhere. The key
 * itself is never printed, including in errors.
 */

import { createHmac } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { loadEnv } from './lib/env.mjs';

const ROOT = process.cwd();
const { name, version } = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));
const ZIP = join(ROOT, `${name}.zip`);

const env = await loadEnv(ROOT);
const url = env.get('API_URL', { required: true }).replace(/\/+$/, '');
const key = env.get('ADMIN_API_KEY', { required: true });

const [id, secret] = key.split(':');
if (!id || !secret) {
	console.error(
		'ADMIN_API_KEY is not in the expected "<id>:<secret>" form.\n' +
		'Copy it from Ghost admin → Settings → Advanced → Integrations, whole,\n' +
		'including the colon. Note that is the Admin API key, not the Content one.',
	);
	process.exit(1);
}

try {
	await stat(ZIP);
} catch {
	console.error(`${name}.zip not found — run \`npm run zip\` first.`);
	process.exit(1);
}

/* ── Ghost's Admin API token ─────────────────────────────────────────────── */

const b64url = (input) =>
	Buffer.from(input).toString('base64')
		.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const now = Math.floor(Date.now() / 1000);
const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: id }));
const payload = b64url(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' }));

const signature = createHmac('sha256', Buffer.from(secret, 'hex'))
	.update(`${header}.${payload}`)
	.digest('base64')
	.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const token = `${header}.${payload}.${signature}`;

const api = async (path, init = {}) => {
	const response = await fetch(`${url}/ghost/api/admin${path}`, {
		...init,
		headers: {
			Authorization: `Ghost ${token}`,
			'Accept-Version': 'v6.0',
			...init.headers,
		},
	});

	const text = await response.text();
	let body;
	try {
		body = JSON.parse(text);
	} catch {
		body = { raw: text.slice(0, 300) };
	}

	if (!response.ok) {
		const message = body?.errors?.[0]?.message || body.raw || response.statusText;
		throw new Error(`${response.status} — ${message}`);
	}

	return body;
};

console.log(`Deploying ${name} v${version} to ${url}`);

const form = new FormData();
form.append('file', new Blob([await readFile(ZIP)], { type: 'application/zip' }), `${name}.zip`);

const uploaded = await api('/themes/upload/', { method: 'POST', body: form });
const theme = uploaded.themes?.[0];

// gscan runs server-side too. Warnings are worth seeing even on success.
for (const warning of theme?.warnings ?? []) {
	console.warn(`  warning: ${warning.rule ?? warning.message}`);
}

await api(`/themes/${theme.name}/activate/`, { method: 'PUT' });

console.log(`Uploaded and activated ${theme.name} v${theme.package?.version ?? version}`);
