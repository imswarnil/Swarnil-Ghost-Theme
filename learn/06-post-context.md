---
title: The post context
slug: the-post-context
excerpt: Every variable a post gives you, which ones are routinely empty, and why designing for the empty ones is most of the work.
tag: Handlebars
order: 6
---

Inside `{{#post}}` or `{{#foreach posts}}` you have the whole post. Here is what
is actually on it, and — more usefully — what is often missing.

## Always there

```hbs
{{title}}            {{url}}          {{id}}
{{content}}          {{excerpt}}      {{reading_time}}
{{published_at}}     {{slug}}         {{access}}
```

`{{content}}` is the rendered HTML of the post body. It is already escaped by
Ghost, so print it with two braces, not three.

`{{excerpt}}` falls back to the first words of the post when no custom excerpt
was written, and takes a `words` parameter: `{{excerpt words="24"}}`.

`{{access}}` is a boolean: can the current visitor read this? It is `false` on a
members-only post seen by a signed-out reader.

## Frequently empty

These are the ones that decide whether your theme looks finished:

```hbs
{{feature_image}}            {{feature_image_alt}}
{{feature_image_caption}}    {{custom_excerpt}}
{{primary_tag}}              {{primary_author.profile_image}}
{{primary_author.bio}}
```

Every one of them is unset on a real post somewhere. A publisher writing quickly
does not add a feature image. Most authors never fill in a bio. Plenty of posts
carry no tags at all.

The marketplace calls this out directly: *ensure good fallbacks when content is
empty or unavailable*. In practice it means every list, every card and every
header needs a designed answer to "what if this is blank" — not a hidden element
that leaves a hole in the grid.

This theme takes three different approaches depending on what is missing:

- **No feature image, in a grid** — the frame stays and fills with a hairline
  hatch, so the row keeps its rhythm.
- **No feature image, in a list** — the media column is skipped entirely and the
  text keeps its alignment.
- **No author picture** — the avatar keeps its circle and shows the same hatch,
  rather than a stock silhouette that asserts something about a person.

## Tags

```hbs
{{#foreach tags visibility="public"}}
    <a href="{{url}}">{{name}}</a>
{{/foreach}}
```

`visibility="public"` matters. Ghost has **internal tags**, written with a `#`
prefix — `#video`, `#featured-series`. They are configuration, not taxonomy:
they exist so a theme can switch behaviour without the reader seeing a tag. Loop
without the filter and you will print `#video` on the page.

`{{primary_tag}}` is the first public tag, and it is what "related posts" should
key off.

## Authors

```hbs
{{#foreach authors}}
    {{name}} {{bio}} {{profile_image}} {{url}}
{{/foreach}}

{{primary_author.name}}
```

A post can have several authors. `{{primary_author}}` is the first. If you only
ever show one, say so in your docs, because a publisher with a co-authored post
will notice.

Both require `include="authors"` when you fetched the posts with `{{#get}}`.

## Dates

```hbs
<time datetime="{{date format="YYYY-MM-DD"}}">{{date format="D MMM YYYY"}}</time>
```

Always put a machine-readable `datetime` on a `<time>` element. Structured data
and assistive technology both use it, and "4 Sep" alone is ambiguous to both.

## What to take from this

- `{{content}}` takes two braces — Ghost already escaped it.
- Feature images, excerpts, bios and tags are all routinely empty.
- Filter tags to `visibility="public"` or you will leak internal tags.
- Designing the empty states *is* the work, not a finishing touch.

Next: giving one post a different shape from the others.
