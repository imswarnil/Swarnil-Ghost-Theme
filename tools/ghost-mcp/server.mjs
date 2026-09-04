#!/usr/bin/env node
/*
 * An MCP server for this theme's two Ghost instances, and nothing else.
 *
 *   live    the public demo — API_URL / ADMIN_API_KEY in .env
 *   local   the development Ghost — LOCAL_API_URL / LOCAL_ADMIN_API_KEY
 *
 * Scope is the point. It exposes the operations a theme product actually needs
 * — inspect a site, list and deploy themes, read and write the pages the demo
 * is made of — against two named instances read from .env. There is no way to
 * point it at an arbitrary host, so a mistaken or injected URL cannot turn it
 * into a general-purpose HTTP client.
 *
 * Safety rules that are deliberate, not incidental:
 *
 *   · every write names its instance explicitly; there is no implicit default,
 *     so "update the page" can never silently mean the live site
 *   · nothing deletes. Removing a post or a page is not something worth
 *     automating on a site with real content
 *   · credentials are read from .env at call time and never returned, logged or
 *     included in an error
 *
 * What Ghost will not let an integration token do
 * ----------------------------------------------
 * Admin API keys are not staff sessions, and Ghost restricts some endpoints to
 * the latter. Verified against both instances on Ghost 6.62:
 *
 *   GET  /themes/                  403 — cannot list installed themes
 *   GET  /custom_theme_settings/   403 — cannot read the Design settings
 *   POST /themes/upload/           allowed
 *   PUT  /themes/<name>/activate/  allowed
 *
 * So there is no tool here for listing themes or reading custom settings: they
 * could only ever return 403. Deploying reports the version and any gscan
 * warnings Ghost recorded, which is what those tools were wanted for. Read the
 * Design settings in Ghost admin.
 *
 * Registered for this project in .mcp.json.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from './ghost.mjs';
import { loadEnv } from '../../scripts/lib/env.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/* ── Instances ───────────────────────────────────────────────────────────── */

const instanceFor = async (name) => {
	const env = await loadEnv(ROOT);

	const config = {
		live: { url: env.get('API_URL'), key: env.get('ADMIN_API_KEY') },
		local: {
			url: env.get('LOCAL_API_URL') || 'http://localhost:2370',
			key: env.get('LOCAL_ADMIN_API_KEY'),
		},
	}[name];

	if (!config) throw new Error(`Unknown instance "${name}". Use "live" or "local".`);
	if (!config.url || !config.key) {
		throw new Error(
			`The "${name}" instance is not configured.\n` +
			(name === 'live'
				? 'Set API_URL and ADMIN_API_KEY in .env.'
				: 'Set LOCAL_API_URL and LOCAL_ADMIN_API_KEY in .env. Create a key with\n' +
				  '`npm run ghost:key` while the development Ghost is running.'),
		);
	}

	return createClient({ url: config.url, adminKey: config.key });
};

const INSTANCE = {
	type: 'string',
	enum: ['live', 'local'],
	description: 'Which Ghost to act on. "live" is the public demo; "local" is the development install.',
};

/* ── Tools ───────────────────────────────────────────────────────────────── */

const TOOLS = [
	{
		name: 'ghost_instances',
		description:
			'List the configured Ghost instances and whether each has credentials. ' +
			'Returns no keys. Start here when unsure what is reachable.',
		inputSchema: { type: 'object', properties: {}, additionalProperties: false },
		handler: async () => {
			const env = await loadEnv(ROOT);
			return [
				{
					instance: 'live',
					url: env.get('API_URL') || null,
					configured: Boolean(env.get('API_URL') && env.get('ADMIN_API_KEY')),
				},
				{
					instance: 'local',
					url: env.get('LOCAL_API_URL') || 'http://localhost:2370',
					configured: Boolean(env.get('LOCAL_ADMIN_API_KEY')),
				},
			];
		},
	},

	{
		name: 'ghost_site',
		description: 'Site title, description, URL and Ghost version.',
		inputSchema: {
			type: 'object',
			properties: { instance: INSTANCE },
			required: ['instance'],
			additionalProperties: false,
		},
		handler: async ({ instance }) => {
			const ghost = await instanceFor(instance);
			return (await ghost.request('/site/')).site;
		},
	},

	{
		name: 'ghost_deploy_theme',
		description:
			'Upload this repository\'s built zip to a Ghost instance and activate it. ' +
			'Run `npm run zip` first — this uploads what is on disk, it does not build. ' +
			'Changes how the site looks immediately.',
		inputSchema: {
			type: 'object',
			properties: {
				instance: INSTANCE,
				activate: {
					type: 'boolean',
					default: true,
					description: 'Activate after uploading. False uploads without switching the live theme.',
				},
			},
			required: ['instance'],
			additionalProperties: false,
		},
		handler: async ({ instance, activate = true }) => {
			const ghost = await instanceFor(instance);
			const { name } = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));
			const zip = join(ROOT, `${name}.zip`);

			try {
				await stat(zip);
			} catch {
				throw new Error(`${name}.zip not found. Run \`npm run zip\` first.`);
			}

			const form = new FormData();
			form.append(
				'file',
				new Blob([await readFile(zip)], { type: 'application/zip' }),
				`${name}.zip`,
			);

			const { themes } = await ghost.request('/themes/upload/', { method: 'POST', body: form });
			const theme = themes[0];

			if (activate) await ghost.request(`/themes/${theme.name}/activate/`, { method: 'PUT' });

			return {
				uploaded: theme.name,
				version: theme.package?.version ?? null,
				activated: activate,
				warnings: (theme.warnings ?? []).map((w) => w.rule ?? w.message),
			};
		},
	},

	{
		name: 'ghost_content',
		description:
			'List posts or pages. Supports NQL filters, e.g. "tag:video" or ' +
			'"status:draft". Returns metadata, not bodies.',
		inputSchema: {
			type: 'object',
			properties: {
				instance: INSTANCE,
				type: { type: 'string', enum: ['posts', 'pages'], default: 'posts' },
				filter: { type: 'string', description: 'NQL filter. Omit for everything.' },
				limit: { type: 'number', default: 20, maximum: 100 },
			},
			required: ['instance'],
			additionalProperties: false,
		},
		handler: async ({ instance, type = 'posts', filter, limit = 20 }) => {
			const ghost = await instanceFor(instance);
			const query = new URLSearchParams({
				limit: String(limit),
				fields: 'id,title,slug,status,visibility,featured,updated_at,url',
			});
			if (filter) query.set('filter', filter);
			const body = await ghost.request(`/${type}/?${query}`);
			return body[type];
		},
	},

	{
		name: 'ghost_page_upsert',
		description:
			'Create a page, or update the existing one with the same slug. Body is ' +
			'HTML, stored in a Lexical html card so it stays editable in the Ghost ' +
			'editor. Use this to build the demo site\'s pages from the repository.',
		inputSchema: {
			type: 'object',
			properties: {
				instance: INSTANCE,
				slug: { type: 'string' },
				title: { type: 'string' },
				html: { type: 'string', description: 'Rendered HTML for the page body.' },
				excerpt: { type: 'string' },
				status: { type: 'string', enum: ['published', 'draft'], default: 'published' },
				show_title_and_feature_image: {
					type: 'boolean',
					default: true,
					description: 'Ghost\'s per-page switch. False when the body supplies its own headline.',
				},
			},
			required: ['instance', 'slug', 'title', 'html'],
			additionalProperties: false,
		},
		handler: async ({ instance, slug, title, html, excerpt, status = 'published', show_title_and_feature_image = true }) => {
			const ghost = await instanceFor(instance);

			const lexical = JSON.stringify({
				root: {
					children: [{ type: 'html', version: 1, html }],
					direction: 'ltr',
					format: '',
					indent: 0,
					type: 'root',
					version: 1,
				},
			});

			const fields = {
				title,
				slug,
				lexical,
				status,
				show_title_and_feature_image,
				...(excerpt ? { custom_excerpt: excerpt } : {}),
			};

			const existing = await ghost.request(
				`/pages/?filter=${encodeURIComponent(`slug:${slug}`)}&limit=1&fields=id,updated_at`,
			);
			const found = existing.pages?.[0];

			if (found) {
				// Ghost uses updated_at for collision detection: without it, a
				// concurrent edit in the admin UI would be silently overwritten.
				const body = await ghost.json(`/pages/${found.id}/`, 'PUT', {
					pages: [{ ...fields, updated_at: found.updated_at }],
				});
				return { action: 'updated', slug, url: body.pages[0].url };
			}

			const body = await ghost.json('/pages/', 'POST', { pages: [fields] });
			return { action: 'created', slug, url: body.pages[0].url };
		},
	},

	{
		name: 'ghost_settings',
		description: 'Read the site settings a theme cares about: title, description, navigation, accent colour.',
		inputSchema: {
			type: 'object',
			properties: { instance: INSTANCE },
			required: ['instance'],
			additionalProperties: false,
		},
		handler: async ({ instance }) => {
			const ghost = await instanceFor(instance);
			const { settings } = await ghost.request('/settings/');
			const wanted = new Set([
				'title', 'description', 'accent_color', 'navigation',
				'secondary_navigation', 'locale', 'timezone',
			]);
			return Object.fromEntries(
				settings.filter((s) => wanted.has(s.key)).map((s) => [s.key, s.value]),
			);
		},
	},

	{
		name: 'ghost_settings_update',
		description:
			'Update site settings. Navigation is an array of {label, url}; a label ' +
			'starting with "- " becomes a dropdown child of the item above it in ' +
			'this theme. Changes are visible on the site immediately.',
		inputSchema: {
			type: 'object',
			properties: {
				instance: INSTANCE,
				title: { type: 'string' },
				description: { type: 'string' },
				accent_color: { type: 'string', description: 'Hex, e.g. #f04e2e' },
				navigation: {
					type: 'array',
					items: {
						type: 'object',
						properties: { label: { type: 'string' }, url: { type: 'string' } },
						required: ['label', 'url'],
					},
				},
				secondary_navigation: {
					type: 'array',
					items: {
						type: 'object',
						properties: { label: { type: 'string' }, url: { type: 'string' } },
						required: ['label', 'url'],
					},
				},
			},
			required: ['instance'],
			additionalProperties: false,
		},
		handler: async ({ instance, ...changes }) => {
			const ghost = await instanceFor(instance);
			const settings = Object.entries(changes).map(([key, value]) => ({
				key,
				// Ghost stores the navigation arrays as JSON strings.
				value: Array.isArray(value) ? JSON.stringify(value) : value,
			}));
			if (!settings.length) throw new Error('Nothing to update.');
			await ghost.json('/settings/', 'PUT', { settings });
			return { updated: settings.map((s) => s.key) };
		},
	},

];

/* ── Wiring ──────────────────────────────────────────────────────────────── */

const server = new Server(
	{ name: 'ghost-theme', version: '1.0.0' },
	{ capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
	tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const tool = TOOLS.find((t) => t.name === request.params.name);
	if (!tool) throw new Error(`Unknown tool: ${request.params.name}`);

	try {
		const result = await tool.handler(request.params.arguments ?? {});
		return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
	} catch (error) {
		// Returned as content rather than thrown, so the caller sees what went
		// wrong instead of a transport-level failure.
		return {
			content: [{ type: 'text', text: `Error: ${error.message}` }],
			isError: true,
		};
	}
});

await server.connect(new StdioServerTransport());
