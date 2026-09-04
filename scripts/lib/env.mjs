/*
 * Reads .env, without a dependency.
 *
 * The file holds the Ghost Admin API key, which is a write credential for a
 * whole site. Two consequences show up in this module:
 *
 *   · nothing here ever prints a value — errors name the missing key and stop
 *   · keys are matched case-insensitively, because a key typed by hand into a
 *     file is as likely to read Content_API_KEY as CONTENT_API_KEY, and failing
 *     on capitalisation would send someone hunting for a problem that is not
 *     there
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const loadEnv = async (root = process.cwd()) => {
	let source = '';
	try {
		source = await readFile(join(root, '.env'), 'utf8');
	} catch {
		// The process environment is a perfectly good source — that is how CI
		// supplies these — so a missing file is not an error on its own.
	}

	const values = new Map();

	for (const line of source.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const at = trimmed.indexOf('=');
		if (at === -1) continue;
		const key = trimmed.slice(0, at).trim();
		let value = trimmed.slice(at + 1).trim();
		// Tolerate quoted values; a pasted key sometimes arrives wrapped.
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		values.set(key.toLowerCase(), value);
	}

	// Real environment variables win, so CI can override the file.
	for (const [key, value] of Object.entries(process.env)) {
		if (value) values.set(key.toLowerCase(), value);
	}

	return {
		get(name, { required = false } = {}) {
			const value = values.get(name.toLowerCase());
			if (required && !value) {
				throw new Error(
					`${name} is not set.\n` +
					'Copy .env.example to .env and fill it in, or export it in the environment.',
				);
			}
			return value;
		},
	};
};
