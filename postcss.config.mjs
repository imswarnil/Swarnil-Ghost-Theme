/*
 * PostCSS pipeline for the Swarnil theme.
 *
 * The file is `.mjs` rather than `.js` on purpose: it lets us write ESM here
 * without adding `"type": "module"` to package.json, which Ghost also reads as
 * the theme manifest.
 *
 * Order matters:
 *   1. import       — inlines the design system and every partial stylesheet
 *                     into one file, so a buyer installs nothing.
 *   2. nested       — lets component files use `&` nesting for BEM elements.
 *   3. preset-env   — compiles modern syntax down to the browserslist target.
 *                     Custom properties are preserved, because runtime theming
 *                     (light/dark, tone switching) depends on them staying live.
 *   4. cssnano      — production only.
 */

import postcssImport from 'postcss-import';
import postcssNested from 'postcss-nested';
import postcssPresetEnv from 'postcss-preset-env';
import cssnano from 'cssnano';

const isProduction = process.env.NODE_ENV === 'production';

export default {
	plugins: [
		postcssImport(),
		postcssNested(),
		postcssPresetEnv({
			stage: 2,
			features: {
				// Keep custom properties live at runtime — the colour scheme and
				// typeface pairing are switched by changing variables, not classes.
				'custom-properties': false,
				'nesting-rules': false,
			},
		}),
		isProduction &&
			cssnano({
				preset: ['default', { discardComments: { removeAll: true } }],
			}),
	].filter(Boolean),
};
