---
title: The layout contract
slug: the-layout-contract
excerpt: default.hbs wraps every page. Four things must be in it, and getting any of them wrong breaks something you will not notice for weeks.
tag: Handlebars
order: 4
---

`default.hbs` is the HTML document every other template renders inside. It is
the one file with genuine non-negotiable requirements.

## The four obligations

```hbs
<!DOCTYPE html>
<html lang="{{@site.locale}}">
<head>
    <title>{{meta_title}}</title>
    <link rel="stylesheet" href="{{asset "built/index.css"}}">
    {{ghost_head}}
</head>
<body class="{{body_class}}">
    {{{body}}}
    {{ghost_foot}}
</body>
</html>
```

**`{{{body}}}`** — three braces, not two. This is where the page template gets
inserted. Two braces would escape the HTML and print your markup as visible
text.

**`{{ghost_head}}`** — must be the last thing before `</head>`. It emits the
canonical URL, Open Graph and Twitter meta, JSON-LD structured data, the RSS
link, and anything the publisher put in code injection. Placing it earlier lets
your own tags override things Ghost is trying to set.

**`{{ghost_foot}}`** — must be the last thing before `</body>`. It loads
members, Portal, search, comments and footer code injection. Search will simply
not work without it, and the failure is silent.

**`{{body_class}}`** — emits context classes like `post-template`,
`tag-template`, `paged`. Ghost's own tooling and plenty of third-party snippets
look for them.

## Assets

Always load theme files through `{{asset}}`:

```hbs
<link rel="stylesheet" href="{{asset "built/index.css"}}">
<script defer src="{{asset "built/index.js"}}"></script>
```

`{{asset}}` resolves the path relative to the theme and appends a cache-busting
query string tied to the theme version. A hard-coded `/assets/…` path will be
cached by a CDN and your buyers will report that an update "did nothing".
Using it is a marketplace requirement, and gscan checks for it.

## Blocking on purpose

This theme has exactly one render-blocking inline script, and it is worth
explaining because the instinct is to remove it:

```hbs
<script>
    (function () {
        var scheme = localStorage.getItem('ghost-theme-scheme') || 'system';
        var resolved = scheme === 'system'
            ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : scheme;
        document.documentElement.setAttribute('data-theme', resolved);
    })();
</script>
```

It has to be inline and synchronous. Defer it, bundle it, move it to the footer —
any of those and the browser paints the light theme first and then repaints. A
reader who chose dark mode gets a white flash on every single navigation.

This is the standard trade: a few hundred bytes of blocking script against a
visible defect on every page load. Take the trade, and leave a comment saying
why, because the next person to read the file will want to tidy it away.

## Settings that are values, not switches

Anything expressible as a class or an attribute should be one. Custom properties
are for the rest:

```hbs
<style>
    :root {
        --t-feature-ratio: {{@custom.feature_image_ratio}};
    }
</style>
```

An aspect ratio is a value; there is no sensible finite set of classes for it.
The colour scheme, by contrast, is an attribute on `<html>` — because the whole
stylesheet keys off it.

## What to take from this

- `{{{body}}}` takes three braces.
- `{{ghost_head}}` last in `<head>`, `{{ghost_foot}}` last in `<body>`.
- Load every theme file through `{{asset}}`, always.
- One inline blocking script for the colour scheme is correct. Comment it.

Next: putting posts on the page.
