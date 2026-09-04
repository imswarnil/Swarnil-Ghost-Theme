# Changelog

Every notable change to the Swarnil theme.

This file is for the project and the documentation site. It is **not** part of
the buyer package — `npm run zip` excludes it, along with `docs/`, `learn/` and
`demo/`. A buyer gets a theme, not a repository.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For a theme, the version boundaries are worth stating plainly:

- **Major** — anything a publisher has to act on. A renamed custom setting, a
  removed template, a changed `routes.yaml` contract. Renaming a `select`
  option counts: the stored value stops matching and their site silently
  changes.
- **Minor** — new settings, new templates, new layouts. Existing sites are
  unaffected.
- **Patch** — fixes and styling corrections that change nothing a publisher
  configured.

## [Unreleased]

## [1.0.0] — 2026-09-04

First release.

### Added

- Two-axis architecture: design-system primitives re-published as `--t-*`
  contract tokens, which are the only thing component CSS reads.
- Three homepage shapes — Call Sheet, Stacked and Grid — switchable from
  Settings → Design with no code change.
- Three post layouts — Standard, Wide and Immersive — selectable per post as
  custom templates, plus a player-first Video template.
- The call-sheet post index: numbered entries driven by a CSS counter, so
  numbering survives pagination and filtering.
- The viewfinder frame: corner brackets drawn over media with two
  pseudo-elements, no extra markup.
- Horizontal tag shelves on the homepage, configured by tag slug.
- Light, dark and system colour schemes, resolved before first paint.
- Three typeface pairings, changing the display face only.
- Table of contents built from post headings at runtime, with heading ids
  generated when Ghost has not supplied them.
- Video chapters lifted from timestamped list items in the post body.
- Designed empty states for every list, missing feature image, missing author
  picture and missing bio.
- Full styling for every Koenig editor card.
- Native Ghost search and comments.
- Seventeen custom settings across site-wide, homepage and post groups.
- One level of navigation dropdown, from a `- ` prefix on a nav item's label —
  no JavaScript, and configured entirely in Settings → Navigation.
- An optional list sidebar — about, topics, recent posts, newsletter — with
  `/home/sidebar/` and `/home/full/` routes so both versions can be compared.
- A `/blog/` channel in `routes.yaml`.
- `.github/workflows/deploy-theme.yml`, deploying to Ghost over the Admin API
  from a custom integration key, on a published release or on demand.
- `learn/` — twelve lessons on Ghost theming, which also generate the demo site.
- `scripts/lint-hbs.mjs` — a linter for the Handlebars traps that fail silently.
- The development Ghost install lives at `.ghost/` inside the repository and is
  driven by `npm run ghost:start` / `:stop` / `:restart` / `:log`.
- `npm test` validates a staged copy of the shippable files rather than the
  working directory, from one shared list in `scripts/lib/shipping.mjs`.
- A multipage documentation site built from `docs/src/*.md`: grouped sidebar,
  per-page contents rail, previous/next pagination, client-side search over a
  generated index, generated section artwork, and a home page with a
  width-switchable live preview.
- `npm run docs:pdf` prints the whole documentation to a single PDF from
  `docs/print.html`, and `npm run zip` puts it in the buyer package.

[Unreleased]: https://github.com/imswarnil/Swarnil-Ghost-Theme/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/imswarnil/Swarnil-Ghost-Theme/releases/tag/v1.0.0
