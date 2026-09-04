# Learn Ghost theming

Twelve lessons that explain how a Ghost theme actually works, in the order you
need them, using this theme as the worked example. Every claim in them is
something you can go and check in the files beside this folder.

They are written to be read in sequence. Lesson 1 assumes nothing beyond having
seen a website before; lesson 12 assumes you have read the other eleven.

## How this folder is used

Each lesson is one Markdown file with a small YAML front matter block:

```yaml
---
title: The template hierarchy
slug: template-hierarchy
excerpt: One sentence for the card and the meta description.
tag: Handlebars
order: 2
template: null          # or wide | immersive | video
featured: false
---
```

`npm run demo` reads every file here, sorts by `order`, and writes
`demo/content.json` — a Ghost import file. Importing it into a fresh Ghost gives
a demo site whose posts *are* these lessons.

That is deliberate. A demo site needs real content of real length to be worth
looking at, and documentation needs somewhere to live. Writing it once and
generating both means the two can never drift apart.

## The lessons

| # | Lesson | What it covers |
| --- | --- | --- |
| 1 | [What a Ghost theme is](01-what-a-theme-is.md) | The required files, `package.json`, gscan |
| 2 | [The template hierarchy](02-template-hierarchy.md) | Which file renders which URL, and why |
| 3 | [Handlebars in Ghost](03-handlebars.md) | Context, helpers, partials, the traps |
| 4 | [The layout contract](04-layout-contract.md) | `default.hbs`, `{{{body}}}`, `ghost_head` |
| 5 | [Listing posts](05-listing-posts.md) | `foreach`, pagination, and `{{#get}}` |
| 6 | [The post context](06-post-context.md) | Every variable available on a post |
| 7 | [Post layouts](07-post-layouts.md) | Custom templates and internal tags |
| 8 | [Routing](08-routing.md) | `routes.yaml`, collections, taxonomies |
| 9 | [Custom settings](09-custom-settings.md) | Theming without touching code |
| 10 | [Members and access](10-members.md) | Tiers, the paywall, the portal |
| 11 | [Assets and images](11-assets.md) | The build, `{{asset}}`, responsive images |
| 12 | [Shipping a theme](12-shipping.md) | Accessibility, SEO, the marketplace bar |
