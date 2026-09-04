---
title: Assets and images
slug: assets-and-images
excerpt: One stylesheet, one script, and images at the sizes you declared — plus why the theme bundles its design system instead of depending on it.
tag: Build
order: 11
---

A Ghost theme ships static files. There is no server-side build, no bundler
running on the publisher's machine. Whatever is in `assets/built/` when you zip
is what every reader downloads.

## The pipeline

This theme uses PostCSS for CSS and esbuild for JavaScript:

```bash
npm run build    # build:css + build:js
npm run dev      # both in watch mode
```

`assets/css/index.css` imports around thirty small files and PostCSS inlines
them into one. `assets/js/index.js` imports five modules and esbuild bundles
them into one. Two requests, no waterfall.

**`assets/built/` is committed on purpose.** It is not build output in the usual
sense — it is the product. Ghost serves it, buyers receive it, and a repository
that omits it produces a broken theme when cloned. Rebuild and commit it
alongside any source change.

## Bundling rather than depending

The theme is styled from a design system that lives in its own package. It could
list it as a dependency and let the publisher install it. It does not: PostCSS
inlines it at build time.

The reason is that a buyer must be able to unzip a theme and upload it. Anything
requiring `npm install` on their side is not a theme, it is a project. The
dependency is a build-time convenience for the theme author and completely
invisible downstream.

## The asset helper

```hbs
<link rel="stylesheet" href="{{asset "built/index.css"}}">
<script defer src="{{asset "built/index.js"}}"></script>
```

`{{asset}}` resolves the path and appends a cache-busting token tied to the
theme version. Hard-code the path and a CDN will serve a stale file after every
update. gscan checks for this, and the marketplace lists it explicitly.

## Image sizes

Ghost only generates the image sizes you declare:

```json
"image_sizes": {
  "s":  { "width": 320 },
  "m":  { "width": 640 },
  "l":  { "width": 960 },
  "xl": { "width": 1200 }
}
```

```hbs
<img src="{{img_url feature_image size="l"}}"
     srcset="{{img_url feature_image size="s"}} 320w,
             {{img_url feature_image size="m"}} 640w,
             {{img_url feature_image size="l"}} 960w"
     sizes="(min-width: 64rem) 960px, 100vw"
     alt="{{title}}" loading="lazy" decoding="async">
```

The two lists have to agree. Ask for a size you did not declare and Ghost quietly
serves the original — a 4000px photograph on a phone, and nothing in the console
to tell you.

## Loading

One image per page should be `loading="eager"`; everything else `lazy`. On a post
that is the feature image. Marking everything eager defeats the point; marking
everything lazy delays the image the reader came for.

## Card assets

```json
"config": { "card_assets": true }
```

This makes Ghost ship its own stylesheet for interactive editor cards — gallery,
audio, video, toggle. Turn it off and you own the behaviour of every one of
them, including the JavaScript. Leave it on and style on top.

## What to take from this

- `assets/built/` is the product. Commit it.
- Bundle your dependencies; a buyer cannot run `npm install`.
- `{{asset}}` for every theme file, always.
- `image_sizes` and your `srcset` must name the same sizes.

Next: the standard a theme has to clear before anyone else sees it.
