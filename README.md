# Swarnil

An editorial Ghost theme for creators who publish in more than one shape —
writing, video and short notes — held together by a call-sheet grid and a single
signal colour.

- **Demo** — <https://theme.imswarnil.com/demo/>
- **Documentation** — <https://theme.imswarnil.com/docs/>
- **Ghost** — 6.0 and later

## What makes it different

Most Ghost themes are a feed of cards. This one is built around a **call sheet**:
a numbered index with hairline rules, monospaced metadata, and a viewfinder
bracket drawn over media on hover. It reads as a production document rather than
a blog roll — which is the point, because the Ghost Marketplace's most-cited
rejection reason is themes that look like every other theme.

Almost monochrome, so that one colour can mean something. The accent marks what
is live, new, or under the cursor, and nothing else.

## Features

**Three homepage shapes.** Call Sheet, Stacked or Grid, switched in Settings →
Design. Same markup, different list class.

**Four post layouts.** Standard, Wide and Immersive are chosen per post from the
Template dropdown, with a site-wide default. Video gives a post a player-first
layout with a chapter list.

**Light, dark and system.** Resolved before first paint, so there is no flash of
the wrong theme. A reader's choice is remembered; publishers set the default.

**Three typeface pairings.** Grotesk, Serif or Mono for headlines. Body text
never changes, because reading should not be a cosmetic setting.

**An optional list sidebar.** Topics, recent posts and the newsletter beside the
feed, on or off from a setting — and reachable both ways at `/home/sidebar/` and
`/home/full/` so you can compare them.

**Navigation dropdowns.** One level, built from a `- ` prefix on a nav item's
label in Settings → Navigation. No JavaScript, no theme edit.

**Every Ghost feature.** Search, comments, members and tiers, the paywall, tag
and author archives, featured posts, custom settings, and every editor card.

**Every empty state designed.** No posts, no feature image, no author picture, no
bio, no tags — each has an intentional appearance rather than a hidden element
and a hole in the layout.

## Install

Download `swarnil.zip` from your purchase, then in Ghost admin go to
**Settings → Design → Change theme → Upload theme**.

That is the whole installation. The theme bundles everything it needs; there is
nothing to `npm install`.

Optional: upload `routes.yaml` under **Settings → Labs → Routes** to add
`/blog/`, and the `/home/sidebar/` and `/home/full/` preview URLs. Everything
else works without it.

Full setup, every setting explained, and how to reproduce the demo:
[the documentation](https://theme.imswarnil.com/docs/).

## Development

```bash
nvm use            # Node 22.23.2
npm install
npm run dev        # watch CSS and JS
npm run verify     # build + lint + gscan, what CI runs
npm run zip        # the buyer package
```

### The development Ghost

A Ghost install lives at `.ghost/` inside this folder — one folder for the whole
product, nothing to go looking for elsewhere. It is gitignored, and it is driven
from here:

```bash
npm run ghost:start      # http://localhost:2370  ·  admin at /ghost/
npm run ghost:restart
npm run ghost:stop
npm run ghost:log
```

The theme is linked in at `.ghost/content/themes/swarnil`, which points back at
this folder, so there is nothing to copy and nothing to keep in sync.

Ghost caches compiled templates, so `.hbs` changes need `npm run ghost:restart`.
CSS and JS changes only need a browser refresh.

**One consequence worth knowing.** Ghost requires the theme to sit at
`content/themes/<name>`, so that link points back at the repository root — and
`gscan .` walks into it and fails with *"Symlinks in themes are not allowed"*.
So `npm test` does not run `gscan .`; it stages the shippable files to a
temporary directory and validates that instead (`scripts/gscan-staged.mjs`).
That is stricter anyway: it checks the exact set of files a buyer receives,
rather than whatever happens to be lying in the folder. The list lives in
`scripts/lib/shipping.mjs` and is shared with the packaging script, so the
validated thing and the shipped thing cannot drift apart.

### How it is organised

```
assets/css/     0 design system → 1 contract → 2 base → 3 layout
                → 4 components → 5 sections → 6 content → 7 templates → 8 utilities
assets/js/      one module per behaviour, bundled to one file
partials/       components, kept few and reused
learn/          twelve lessons on Ghost theming; also generates the demo
docs/src/       the buyer documentation, one Markdown file per section
docs/           the generated multipage site, plus its hand-authored CSS and JS
demo/           generated Ghost import file and cover art
```

The layer order in `assets/css/index.css` is the architecture, and the rule that
keeps it working is stated there: **anything in layers 3–8 reads `--t-*` contract
tokens and nothing else.** Reaching past the contract into a design-system
primitive is what makes light/dark and the typeface settings quietly stop
working.

`assets/built/` is committed on purpose — it is what Ghost serves and what ships
to a buyer. Rebuild and commit it alongside any source change.

### Checks

```bash
npm run lint:css   # stylelint, including the ghost-* BEM class pattern
npm run lint:hbs   # the Handlebars traps that fail silently
npm test           # gscan
```

`lint:hbs` is worth knowing about. It catches three Ghost-specific mistakes that
compile fine, render nothing, and report no error on the page: `{{match}}` used
as a subexpression, block-only helpers used as subexpressions, and a `{{#get}}`
nested inside another `{{#get}}`'s `{{else}}`. Each one is explained in
[lesson 3](https://github.com/imswarnil/Swarnil-Ghost-Theme/blob/main/learn/03-handlebars.md).

## Learn Ghost theming

`learn/` holds twelve lessons covering templates, Handlebars, routing, custom
settings, members, assets and shipping — written against this theme, so every
claim can be checked in the file beside it. They also generate the demo content:
`npm run demo` turns them into a Ghost import file.

Start at [what a Ghost theme actually is](https://github.com/imswarnil/Swarnil-Ghost-Theme/blob/main/learn/01-what-a-theme-is.md).

## Deploying

`.github/workflows/deploy-theme.yml` pushes the theme straight to a Ghost site
over the Admin API. It runs on a published release, or on demand from the
Actions tab.

Two repository secrets are needed:

| Secret | Where it comes from |
| --- | --- |
| `GHOST_ADMIN_API_URL` | the site's origin, e.g. `https://imswarnil.com` |
| `GHOST_ADMIN_API_KEY` | Ghost admin → Settings → Advanced → Integrations → Add custom integration → **Admin API key** |

The Admin API key is a write credential for the whole site. Keep it in GitHub
Secrets and revoke the integration in Ghost if it ever leaks.

## Support

Email the address in `package.json`. Include your Ghost version and, if you can,
a link to the page that is wrong.

## Licence

Commercial. One licence covers one Ghost publication and its staging and
development installs. See [LICENSE](LICENSE).

The bundled Creator Design System is MIT and remains available separately.
