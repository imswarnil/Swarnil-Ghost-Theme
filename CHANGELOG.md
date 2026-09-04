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

### Changed

- **Fewer settings.** Eighteen became fifteen, and each one now earns its place.
  Gone: the header style (three variants where two were used on about one page
  each), the homepage kicker and intro, the featured-post selector, the tag
  shelves, and the toggle that hid the colour toggle. What a publisher fills in
  once — title, description, logo, cover, social accounts — the theme now reads
  from Ghost rather than asking for again.
- **No monospace face for metadata.** The slate voice is the body face with
  weight and 0.14em of tracking instead of a third webfont for text that is
  never more than four words long. Code stays monospace, where character
  alignment carries meaning.
- **The hero is built from the publication.** Logo, title, description, social
  accounts and cover image, in three shapes: two columns, full-width background,
  or plain. Both image shapes fall back to plain when there is no cover, which
  is what a new Ghost has.
- **The navigation lost its dropdown.** A nesting convention a publisher has to
  be taught, in a menu five items long, is complexity nobody asked for. Labels
  beginning with `- ` are skipped, so an upgrade does not print stray dashes.
- One header style instead of three, with more room between navigation items.

### Added

- `hero_style`, `hero_cta_label`, `hero_cta_url`, `show_hero_signup`.

### Removed

- `header_style`, `homepage_intro`, `homepage_kicker`, `homepage_lead`,
  `homepage_shelf_tags`, `show_subscribe_band`, `show_color_scheme_toggle`, and
  the "Mono & Sans" typeface pairing.
- The `/home/sidebar/` and `/home/full/` preview routes, and the Preview page.

### Changed

- The colour control is two modes, light and dark, instead of cycling through a
  third "system" position. The system preference still decides what a first-time
  visitor sees; it is just not a position on the switch, because pressing a
  three-state control from "system" often changes nothing visible.
- The header navigation is centred in its own grid track, so it sits on the
  centre of the page rather than on whatever space the brand left over.
- Navigation items carry an inferred icon — from the URL first, then from words
  in the label — and unrecognised items simply get none.
- The homepage opens with a stated hero: the site title as the headline, the
  intro as a lede, and two actions. The lead post follows beneath it.
- The post contents rail moved to the right of the reading column. A left-hand
  rail competes with the text for the eye's return point on every line.

### Added

- `homepage_kicker` — an optional short label above the site title in the hero.
- `npm run covers` applies the generated SVG cover art to every post on an
  instance, skipping any that already has an image.
- `npm run docs:publish` publishes the documentation as a page on a Ghost site,
  from the same Markdown as the static site and the PDF.

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
