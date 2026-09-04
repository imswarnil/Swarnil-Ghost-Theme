---
title: Layouts
slug: layouts
group: Reference
icon: layout
order: 4
summary: Four post layouts and three homepage shapes, chosen without touching code.
---

Four layouts. One is the site-wide default; the other three are chosen per post.

## Post layouts

### Setting the default

**Settings → Design → Post → Post layout** applies to every post that has not
been given its own template.

### Overriding one post

Open the post, then in the settings sidebar (the cog, top right) find
**Template**. The dropdown lists:

- **Default** — whatever the site-wide setting says
- **Wide** — a broader reading column and a 21:9 feature image, for posts
  carried by pictures
- **Immersive** — the title set over a full-height feature image
- **Video** — a player-first layout with a chapter list beside the writing

The choice is saved with the post and survives renaming its slug.

> **Immersive without a feature image** renders exactly like Standard. That is
> deliberate: a title floating on an empty grey block looks broken rather than
> dramatic. Add an image and the layout appears.

### The Video layout

A post on the Video template shows its feature image as a poster at the top, then
the writing beside a chapter panel.

**Chapters** are ordinary list items in the post body that begin with a
timestamp:

```
- 00:00 Introduction
- 01:24 Setting up the shot
- 04:50 The edit
```

The theme lifts them into the panel. Written as a plain list they still make
sense in your RSS feed, in an email newsletter, and for anyone with JavaScript
off — nothing about the post depends on the theme to be readable.

**Marking a post as video** anywhere else on the site — so its card gets a play
badge — is done with the internal tag `#video`. Internal tags start with a `#`
and are never shown to readers. Add it in the post's tag field alongside your
normal tags.

## Homepage shapes

**Settings → Design → Homepage → Homepage layout**

- **Call Sheet** — a numbered index with hairline rules and small media strips.
  The theme's own voice, and the best choice for a publication that writes more
  than it shoots.
- **Stacked** — one full-width card per row, media above the words. Good when you
  have few posts and a grid would look sparse.
- **Grid** — three cards across. The familiar magazine shape.

### Shelves

**Homepage shelf tags** adds a horizontally scrolling row for each tag slug you
name. `video,notes` gives two shelves, above the main feed, each linking through
to its tag archive.

Use the slug, not the name — `how-to`, not `How To`. Find it in
**Tags → (your tag) → Tag slug**. No spaces anywhere in the list.

## The sidebar

**Settings → Design → Site-wide → Sidebar on lists** adds a second column beside
the homepage and every archive, holding four widgets: a short about line, your
most-used topics, recent posts, and the newsletter form.

Each widget removes itself when it has nothing to show, so a new site does not
get a column of empty boxes. On a phone the sidebar moves below the feed rather
than disappearing — hiding it would mean the topics and the newsletter simply do
not exist where most people read.

If you have uploaded the theme's `routes.yaml`, you can see both versions
without changing the setting:

- `/home/sidebar/` — the homepage with the sidebar
- `/home/full/` — the homepage at full width

## Navigation dropdowns

Ghost's navigation is a flat list. The theme turns it into one level of
dropdown using a convention: **an item whose label starts with `- ` becomes a
child of the item above it.**

In **Settings → Navigation**, this:

| Label | URL |
| --- | --- |
| `Preview` | `/preview/` |
| `Home` | `/` |
| `- With sidebar` | `/home/sidebar/` |
| `- Without sidebar` | `/home/full/` |
| `About` | `/about/` |
| `Blog` | `/blog/` |
| `Contact` | `/contact/` |

gives a header of five items, where Home carries a dropdown holding the two
homepage layouts. The `- ` is a marker only; it never appears on the page.

The parent stays a real link, so Home still goes to `/`. The panel opens on
hover and on keyboard focus, and needs no JavaScript.

In the mobile drawer and the footer there is no panel to open: children are
indented under their parent and always visible. A dropdown inside a drawer is a
menu inside a menu.

> One level only. A label like `- - Deeper` will be treated as an ordinary
> child, not as a grandchild.
