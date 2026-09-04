---
title: What a Ghost theme actually is
slug: what-a-ghost-theme-is
excerpt: A folder of Handlebars files and one manifest. There is no framework underneath, and knowing that makes everything else easier.
tag: Foundations
order: 1
featured: true
---

A Ghost theme is a folder. Ghost reads it, finds some files it expects by name,
and renders your content through them. There is no plugin API, no lifecycle, no
component tree. Once that lands, the rest of Ghost theming stops feeling
mysterious.

## The smallest theme that works

Three files:

```
my-theme/
├── package.json
├── default.hbs
└── index.hbs
```

`index.hbs` renders a list of posts. `default.hbs` wraps it in an HTML document.
`package.json` tells Ghost what the theme is called and what it needs. Upload a
zip of those three and Ghost will serve your site.

Everything else — `post.hbs`, `tag.hbs`, partials, custom settings — is Ghost
noticing that a file exists and using it. Nothing registers itself.

## The manifest

`package.json` is a normal npm manifest with a `config` block Ghost reads:

```json
{
  "name": "swarnil",
  "version": "1.0.0",
  "description": "An editorial Ghost theme for creators.",
  "author": { "name": "Swarnil Singhai", "email": "you@example.com" },
  "engines": { "ghost": ">=6.0.0" },
  "config": {
    "posts_per_page": 12,
    "card_assets": true,
    "image_sizes": { "m": { "width": 640 } },
    "custom": {}
  }
}
```

Four fields are not optional and Ghost will reject the theme without them:
`name`, `version`, `description`, and `author.email`. The last one catches
people out — it is there because a theme in the marketplace has to have somewhere
to send support requests.

`engines.ghost` is a semver range. Set it to what you have actually tested
against, not to what you hope will work.

## What Ghost does at upload

When you upload a zip, Ghost:

1. unpacks it and reads `package.json`
2. runs **gscan**, its own validator, over the files
3. rejects the theme on any error, and warns on anything questionable
4. stores it, and activates it if you asked

gscan is not a linter you can argue with. If it errors, the theme does not
install. So run it yourself before you ever open the admin panel:

```bash
npx gscan .
```

It is worth reading its output carefully even when it passes. Warnings are
usually about features you have not implemented yet rather than mistakes — a
missing `{{#if @page.show_title_and_feature_image}}`, or an asset loaded without
the `{{asset}}` helper.

## Where the theme lives

On a local install, themes sit in `content/themes/`. Ghost follows symlinks, so
the usual development setup is to keep the theme in its own git repository
somewhere sensible and link it in:

```bash
ln -s ~/code/my-theme ~/ghost/content/themes/my-theme
```

Now the theme is a normal repository with normal history, and Ghost sees it
anyway.

## What to take from this

- A theme is files on disk, discovered by name. Nothing is registered.
- `package.json` is the only configuration, and four of its fields are mandatory.
- gscan decides whether your theme installs. Run it before Ghost does.

Next: which of those files Ghost picks for a given URL.
