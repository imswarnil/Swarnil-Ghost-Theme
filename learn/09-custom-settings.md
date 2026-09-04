---
title: Custom settings
slug: custom-settings
excerpt: If a publisher would have to edit a template to change something reasonable, it belongs in package.json instead.
tag: Settings
order: 9
---

Custom settings turn a theme from a starting point into a product. They live in
`package.json` under `config.custom`, and Ghost renders them as real form
controls in **Settings → Design**.

## The shape

```json
"custom": {
  "homepage_layout": {
    "type": "select",
    "options": ["Call Sheet", "Stacked", "Grid"],
    "default": "Call Sheet",
    "group": "homepage",
    "description": "The overall shape of the homepage."
  }
}
```

Five types: `select`, `boolean`, `color`, `image`, `text`.

Three groups: `homepage`, `post`, and — by leaving `group` out — site-wide.
Ghost shows grouped settings in context, so a `homepage` setting appears while
the publisher is previewing the homepage.

Read them with `@custom`:

```hbs
{{#match @custom.homepage_layout "Grid"}} … {{/match}}
{{#if @custom.show_reading_time}} … {{/if}}
{{@custom.footer_note}}
```

## The rule that matters

*If a publisher would need to touch `.hbs` or CSS to change something reasonable,
it belongs in a setting.*

"Reasonable" is doing work in that sentence. A setting for every colour is not
usability, it is an unfinished design — and reviewers read a long settings list
as indecision. Pick the handful of choices that genuinely differ between
publications and make those excellent.

## Selects are contracts

An option string is used verbatim in your templates:

```json
"options": ["Call Sheet", "Stacked", "Grid"]
```

```hbs
{{#match @custom.homepage_layout "Call Sheet"}}
```

The comparison is exact — spaces, capitals, everything. Rename an option in
`package.json` and every template comparing against the old string silently
stops matching. There is no error; the branch just never runs.

Worse, a publisher who already chose the old value keeps it in their database,
and now their site matches nothing at all. Renaming an option in a released
theme is a breaking change. Treat it like one.

## Values versus switches

Anything that maps to a finite set should become a class or an attribute:

```hbs
<html data-typeface="{{#match @custom.typeface_pairing "Serif & Sans"}}serif{{else}}grotesk{{/match}}">
```

Anything continuous has to become a custom property:

```hbs
<style>:root { --t-feature-ratio: {{@custom.feature_image_ratio}}; }</style>
```

Prefer the first. Attributes are inspectable, cacheable, and cannot be broken by
an unexpected value.

## Descriptions are documentation

Every setting takes a `description`, and it is rendered right under the control.
It is the only documentation a publisher is guaranteed to see, so spend the
sentence:

```json
"description": "Tag slugs shown as horizontal shelves. Comma-separated, no spaces, e.g. video,notes"
```

That one says what it does, what format it wants, and shows an example — because
the value is split on commas without trimming, and a stray space would produce a
shelf that silently matches nothing.

## What to take from this

- Settings live in `package.json` and appear in Settings → Design.
- Anything a publisher would reasonably want to change belongs in one.
- A select's option strings are compared verbatim. Renaming one is breaking.
- Write the `description`. It is the only docs most people will read.

Next: the readers who pay.
