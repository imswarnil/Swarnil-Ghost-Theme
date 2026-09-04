---
title: The demo content
slug: demo
group: Going further
icon: package
order: 5
summary: Import the demo site and start from the same place the preview does.
---

The demo site is real content, and you can have the same starting point.

> **Do this on a fresh Ghost install, not on your live site.** Importing adds
> posts, pages, tags and an author. It does not delete anything, but untangling
> it afterwards is tedious.

1. Download `demo/content.json` from the theme package.
2. In Ghost admin: **Settings → Import/Export → Import content**.
3. Select the file.

You get twelve posts, three pages — About, Preview and Contact — and the tags they use.

## Feature images

The import contains no images. A Ghost import file can only reference URLs, and
a portable one cannot assume where it will be imported.

Add your own, or use the cover art in `demo/covers/` — twelve flat SVGs drawn in
the theme's palette. Upload one per post through the editor's feature image
field.

## Settings the demo uses

| Setting | Value |
| --- | --- |
| Homepage layout | Call Sheet |
| Homepage lead | Featured Post |
| Homepage shelf tags | `handlebars,layouts` |
| Post layout | Standard |
| Header style | Rule |
| Typeface pairing | Grotesk & Sans |
| Accent colour | `#f04e2e` |

Navigation, in **Settings → Navigation** — note the `- ` prefixes, which make
the two indented items into a dropdown under Home:

| Label | URL |
| --- | --- |
| `Preview` | `/preview/` |
| `Home` | `/` |
| `- With sidebar` | `/home/sidebar/` |
| `- Without sidebar` | `/home/full/` |
| `About` | `/about/` |
| `Blog` | `/blog/` |
| `Contact` | `/contact/` |

Secondary navigation: a few tag archives and the author page.

The `/blog/`, `/home/sidebar/` and `/home/full/` URLs need the theme's
`routes.yaml` uploaded under **Settings → Labs → Routes**.

## The "Every layout" page

The demo includes a page that links to a live example of every template the
theme ships. It is worth keeping while you are deciding which layouts you want —
it is faster than switching settings back and forth.
