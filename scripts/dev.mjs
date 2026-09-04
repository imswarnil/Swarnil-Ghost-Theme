/*
 * Development watcher.
 *
 * Runs the CSS and JS builds in watch mode side by side. There is no dev
 * server: Ghost itself serves the theme, so the loop is
 *   edit → rebuild → refresh the Ghost tab.
 *
 * Ghost caches compiled Handlebars, so template edits need `ghost restart`.
 * CSS and JS changes only need a browser refresh.
 */

import { spawn } from 'node:child_process';
import { context } from 'esbuild';

process.env.NODE_ENV = 'development';

// CSS: postcss-cli watches the whole import graph for us.
const css = spawn(
	'npx',
	['postcss', 'assets/css/index.css', '-o', 'assets/built/index.css', '--watch'],
	{ stdio: 'inherit', env: process.env },
);

// JS: esbuild's own watcher.
const ctx = await context({
	entryPoints: ['assets/js/index.js'],
	outfile: 'assets/built/index.js',
	bundle: true,
	format: 'iife',
	target: ['es2020'],
	sourcemap: true,
	logLevel: 'info',
});
await ctx.watch();

console.log('\nWatching assets/css and assets/js. Ctrl-C to stop.');
console.log('Template (.hbs) changes need `ghost restart` to take effect.\n');

const stop = async () => {
	css.kill();
	await ctx.dispose();
	process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
