---
title: Settings
slug: settings
group: Reference
icon: sliders
order: 3
summary: All sixteen settings, what each one changes, and which four to set on day one.
---

Every setting is in **Settings → Design**, split into three groups. None of them
requires touching code, which is the rule the theme is built to: if you would
reasonably want to change it, it is here.

## Site-wide

| Setting | Options | What it does |
| --- | --- | --- |
| **Colour scheme** | System · Light · Dark | What a first-time visitor sees. They can override it with the header toggle, and their choice is remembered. |
| **Typeface pairing** | Grotesk & Sans · Serif & Sans · Mono & Sans | The display face used for headlines. Body text never changes. |
| **Header style** | Rule · Plate · Over Media | Rule is a hairline underneath. Plate is a filled bar that lifts on scroll. Over Media sits transparently on a feature image and becomes a plate once you scroll past it. |
| **Sidebar on lists** | on / off | A second column beside the homepage and archives, with topics, recent posts and the newsletter. |
| **Footer note** | text | A short line above the footer navigation. Blank hides it. |

## Homepage

| Setting | Options | What it does |
| --- | --- | --- |
| **Hero CTA label** | text | The button in the hero. Blank hides it. |
| **Hero CTA URL** | text | Where that button goes. `#latest` jumps to the post list below. |
| **Show hero signup** | on / off | The email form in the hero. Only appears if memberships are on. |
| **Homepage layout** | Call Sheet · Stacked · Grid | Call Sheet is a numbered index with hairline rules. Stacked is one full-width card per row. Grid is three across. |

## Post

| Setting | Options | What it does |
| --- | --- | --- |
| **Post layout** | Standard · Wide · Immersive | The default for every post. Individual posts override it — see [post layouts](#post-layouts). |
| **Feature image ratio** | auto · 16/9 · 3/2 · 4/3 · 1/1 · 21/9 | The crop applied to feature images. `auto` keeps each image's own shape. |
| **Show reading time** | on / off | The estimate in the byline. |
| **Show table of contents** | on / off | Built from the headings in each post. Posts with fewer than three headings never show one — a two-item contents list is noise. |
| **Show author card** | on / off | The author block beneath a post. |
| **Show read next** | on / off | Related posts beneath a post, drawn from the primary tag. |

> **A note on renaming.** If you fork the theme and rename a setting's options,
> rename them everywhere. Ghost compares the stored string exactly, so a site
> that already chose the old value will silently match nothing.
