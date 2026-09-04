/*
 * Bundles the theme's JavaScript with esbuild.
 *
 * One entry point, one output file. The theme deliberately ships no runtime
 * framework — everything in assets/js is plain DOM code against the platform.
 */

import { build } from 'esbuild';

const isProduction = process.env.NODE_ENV !== 'development';

await build({
	entryPoints: ['assets/js/index.js'],
	outfile: 'assets/built/index.js',
	bundle: true,
	format: 'iife',
	target: ['es2020'],
	minify: isProduction,
	sourcemap: !isProduction,
	logLevel: 'info',
});
