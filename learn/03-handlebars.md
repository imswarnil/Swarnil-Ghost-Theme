---
title: Handlebars in Ghost
slug: handlebars-in-ghost
excerpt: Context, helpers and partials — plus the three helper traps that fail silently and cost an afternoon each.
tag: Handlebars
order: 3
template: video
---

Ghost templates are Handlebars. If you have written any templating language the
syntax will not surprise you. What *will* surprise you is a handful of Ghost
helpers that behave differently from how they read.

## Context

Handlebars evaluates every expression against a current context — "the thing we
are talking about right now". `{{title}}` means "the title of the current
context".

Block helpers change it:

```hbs
{{#post}}
    {{title}}     {{!-- the post's title --}}
{{/post}}

{{#foreach posts}}
    {{title}}     {{!-- each post's title, in turn --}}
{{/foreach}}
```

`../` climbs back out one level:

```hbs
{{#foreach posts}}
    {{title}} — on {{../@site.title}}
{{/foreach}}
```

And `@`-prefixed values are global, reachable from anywhere: `@site`, `@custom`,
`@member`, `@config`, plus loop state like `@index`, `@first`, `@last`.

## Partials

A partial is a reusable fragment in `partials/`:

```hbs
{{> "byline"}}                        {{!-- inherits the current context --}}
{{> "frame" src=feature_image alt=title}}   {{!-- plus named parameters --}}
```

The inheritance is the important half. `{{> "byline"}}` inside a
`{{#foreach posts}}` sees the current post without being handed it, which is why
this theme's card, entry and byline partials take almost no parameters.

Partials nest and can be organised into folders (`{{> "post/meta"}}`), but the
marketplace guidance is explicit: use partials to manage components sensibly,
not for every snippet. A partial that is used once and is five lines long is
filing, not architecture.

## The three traps

These all compile. They all fail at runtime. None of them says so on the page.

### 1. `{{match}}` as a subexpression is always truthy

```hbs
{{!-- BROKEN: never renders --}}
{{#unless (match @custom.layout "None")}} … {{/unless}}
```

Used as a subexpression, `match` returns a `SafeString` *object*, not a boolean.
Objects are truthy, so the condition can never be false. Use the block form:

```hbs
{{#match @custom.layout "None"}}{{else}} … {{/match}}
```

### 2. Block-only helpers throw as subexpressions

`has`, `is` and `foreach` only work as blocks. Written as subexpressions —
`{{> "frame" video=(has tag="#video")}}` — they throw
`options.inverse is not a function`. Ghost logs it and renders the surrounding
section as nothing at all. You get a blank space and no error on the page.

Move the check inside the partial, where it can be a block:

```hbs
{{#has tag="#video"}} … {{/has}}
```

### 3. `{{#get}}` does not run async helpers in its `{{else}}`

```hbs
{{!-- BROKEN: the inner query renders nothing --}}
{{#get "posts" filter="featured:true" limit="1"}}
    …
{{else}}
    {{#get "posts" limit="1"}} … {{/get}}
{{/get}}
```

`{{#get}}` is asynchronous. Ghost resolves nested async helpers inside the
*body* of a `get`, but not inside its inverse branch. The fallback query silently
produces nothing.

Express the fallback as an ordering on one query instead:

```hbs
{{#get "posts" limit="1" order="featured desc, published_at desc"}} … {{/get}}
```

That returns the featured post when one exists and the latest post when none
does — in a single query, with no nesting.

## Guarding against them

This theme keeps a small linter at `scripts/lint-hbs.mjs` that fails the build
on all three. It exists because each one cost real time, and because none of
them is something gscan checks — gscan validates compatibility with Ghost's API,
not whether your logic can ever be reached.

## What to take from this

- Context is "the thing we are talking about"; `../` climbs out, `@` is global.
- Partials inherit context, which is what makes them worth having.
- `match` as a subexpression, block helpers as subexpressions, and nested
  `{{#get}}` fallbacks all fail quietly. Learn the three shapes.

Next: the file every one of these templates is wrapped in.
