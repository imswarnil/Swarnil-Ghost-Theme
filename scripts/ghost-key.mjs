/*
 * Creates an Admin API key on the development Ghost, and writes it to .env.
 *
 *   npm run ghost:key
 *
 * The live site's key comes from Ghost admin, where a human clicks "Add custom
 * integration". The development install has no such ceremony worth performing
 * every time it is rebuilt, so this does the same thing directly against its
 * database: one custom integration, one admin key, recorded in .env as
 * LOCAL_ADMIN_API_KEY.
 *
 * It is deliberately limited to the local install. Writing key rows into a
 * database is a reasonable thing to do to a disposable development site and an
 * unreasonable thing to do to a real one — a key created this way never went
 * through the audit trail a real site should have. For anything live, use Ghost
 * admin.
 *
 * Ghost must be stopped, or it may hold the SQLite file. Re-running is safe: an
 * existing key with the same name is reused rather than duplicated.
 */

import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { access, appendFile, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const ROOT = process.cwd();
const DB = join(homedir(), 'Swarnil', 'ghost-theme-dev', 'content', 'data', 'ghost-local.db');
const NAME = 'Theme tooling';
const URL = 'http://localhost:2370';

try {
	await access(DB, constants.R_OK | constants.W_OK);
} catch {
	console.error(`No development Ghost database at ${DB}`);
	process.exit(1);
}

const sql = async (statement) =>
	(await run('sqlite3', [DB, statement])).stdout.trim();

/* Ghost ids are 24 hex characters — the shape of a Mongo ObjectID, which is what
   it used before it moved to SQL. */
const oid = () => randomBytes(12).toString('hex');

const existing = await sql(
	`select k.id, k.secret from api_keys k
	   join integrations i on i.id = k.integration_id
	  where i.name = '${NAME}' and k.type = 'admin' limit 1;`,
);

let id;
let secret;

if (existing) {
	[id, secret] = existing.split('|');
	console.log('Reusing the existing key.');
} else {
	const roleId = await sql("select id from roles where name = 'Admin Integration' limit 1;");
	if (!roleId) {
		console.error('No "Admin Integration" role in this database — is it a Ghost 6 install?');
		process.exit(1);
	}

	const integrationId = oid();
	id = oid();
	secret = randomBytes(32).toString('hex');
	const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

	await sql(
		`insert into integrations (id, type, name, slug, description, created_at, updated_at)
		 values ('${integrationId}', 'custom', '${NAME}', 'theme-tooling',
		         'Created by npm run ghost:key for local theme development.',
		         '${now}', '${now}');
		 insert into api_keys (id, type, secret, role_id, integration_id, created_at, updated_at)
		 values ('${id}', 'admin', '${secret}', '${roleId}', '${integrationId}', '${now}', '${now}');`,
	);
	console.log('Created a new custom integration.');
}

/* ── Record it in .env ───────────────────────────────────────────────────── */

const envPath = join(ROOT, '.env');
let env = '';
try {
	env = await readFile(envPath, 'utf8');
} catch {
	/* first run */
}

const set = (source, key, value) => {
	const line = `${key}=${value}`;
	const pattern = new RegExp(`^${key}=.*$`, 'm');
	return pattern.test(source) ? source.replace(pattern, line) : `${source.trimEnd()}\n${line}\n`;
};

env = set(env, 'LOCAL_API_URL', URL);
env = set(env, 'LOCAL_ADMIN_API_KEY', `${id}:${secret}`);
await writeFile(envPath, env.startsWith('\n') ? env.trimStart() : env);

console.log(
	`\nLOCAL_ADMIN_API_KEY written to .env (${id}:… — the secret is not printed).\n` +
	'Restart Ghost so it picks the key up:  npm run ghost:restart',
);
