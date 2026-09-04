---
title: Troubleshooting
slug: troubleshooting
group: Help
icon: help
order: 7
summary: The eight things that actually go wrong, and what each one means.
---

## The homepage is a plain list, not the layout I chose

The homepage sections come from `home.hbs`, which Ghost uses automatically. If
you are seeing a plain paginated list, a `routes.yaml` on your site is pointing
`/` somewhere else. Check **Settings → Labs → Routes**.

## A shelf is empty or missing

**Homepage shelf tags** takes tag *slugs*, comma-separated, with no spaces.
`video, notes` fails because of the space; `video,notes` works. Find the slug
under **Tags → (your tag) → Tag slug**.

A shelf also needs published posts carrying that tag.

## A navigation dropdown does not open

Children are marked with a leading `- ` and a space — `- With sidebar`, not
`-With sidebar`. Without the space the item is treated as an ordinary top-level
link, and the parent gets no chevron.

Only one level is supported.

## /blog/ or /home/sidebar/ gives a 404

Those URLs come from the theme's `routes.yaml`, which Ghost does not install
with a theme. Upload it under **Settings → Labs → Routes**.

## The table of contents does not appear

It needs at least three `##` or `###` headings in the post. Below that the theme
removes it, because a two-item contents list is noise. Check the setting is on
under **Settings → Design → Post**.

## My accent colour looks wrong in dark mode

The theme derives hover and focus tints from your accent, lightening them in
dark mode and darkening them in light. Very dark accents have little room to
darken further. If the hover state is invisible, pick a mid-tone accent — one
that works as text on white *and* as a fill on near-black.

## The colour scheme flashes on load

It should not: the theme resolves the scheme in a small inline script before the
page paints. If you see a flash, something in **Code injection → Site header**
is loading a large blocking stylesheet ahead of it. Move it to the footer, or
load it asynchronously.

## Posts disappeared after uploading routes.yaml

Almost always a `filter` on the root collection. Every post belongs to exactly
one collection, and its URL comes from that collection — so a post excluded by a
filter, with no other collection to catch it, has no URL at all. It is still in
admin, still marked published, and unreachable.

Either remove the filter or add a second, unfiltered collection beneath it.

## An update did not change anything

Ghost caches theme assets aggressively. After uploading a new version, hard
refresh (**Cmd/Ctrl + Shift + R**). If you are behind a CDN, purge its cache too.

## Something else

Email the address in `package.json`. Include your Ghost version, the theme
version from **Settings → Design**, and a link to the page that is wrong.
