---
title: Listing posts
slug: listing-posts
excerpt: foreach for what the route gave you, get for anything else, and pagination that a search engine can actually follow.
tag: Handlebars
order: 5
---

Most of a theme is lists of posts. There are two ways to get them, and picking
the wrong one is the usual cause of a slow homepage.

## What the route already gave you

On `index.hbs`, `tag.hbs` and `author.hbs`, Ghost has already run the query.
The posts are sitting in `posts`:

```hbs
{{#foreach posts}}
    <h2><a href="{{url}}">{{title}}</a></h2>
{{/foreach}}
```

This costs nothing extra — the data is already loaded. How many you get is
`posts_per_page` in `package.json`.

`{{#foreach}}` gives you loop state: `@index` (zero-based), `@number`
(one-based), `@first`, `@last`, and it accepts `limit`, `from` and `visibility`.

## Fetching something else

For anything the route did not hand you — a shelf of posts from one tag, related
posts under an article — use `{{#get}}`:

```hbs
{{#get "posts" filter="tag:video" limit="8" include="authors,tags" as |videos|}}
    {{#foreach videos}}
        {{> "card"}}
    {{/foreach}}
{{else}}
    <p>Nothing here yet.</p>
{{/get}}
```

Three things to hold onto:

**The `{{else}}` runs when the query is empty.** That is where your empty state
belongs. Putting it inside a partial after an `{{#if posts}}` will never be
reached, because Handlebars never enters the body at all.

**`include` is not free but not optional either.** Without `include="authors"`,
`{{primary_author.name}}` is empty. Ask for what you use and nothing more.

**Every `{{#get}}` is a real query.** Six of them on a homepage is six queries on
every uncached request. Ghost caches aggressively in production, but the first
visitor still pays.

## Filters

The filter string is NQL, Ghost's query language:

| Filter | Meaning |
| --- | --- |
| `featured:true` | featured posts |
| `tag:video` | tagged `video` |
| `tags:[video,notes]` | tagged either |
| `id:-{{id}}` | everything except this post |
| `tag:video+featured:true` | both (`+` is AND) |
| `tag:video,tag:notes` | either (`,` is OR) |

`{{...}}` interpolation works inside the string, which is how "related posts,
but not this one" is written:

```hbs
{{#get "posts" filter="tags:{{primary_tag.slug}}+id:-{{id}}" limit="3"}}
```

## Ordering as a fallback

Because `{{#get}}` cannot nest a fallback query in its `{{else}}` (see lesson 3),
`order` is often the answer:

```hbs
{{#get "posts" limit="1" order="featured desc, published_at desc"}}
```

"The featured post, or the newest one if nothing is featured" — one query, no
branching. Reach for `order` whenever a fallback is really a preference.

## Pagination

```hbs
{{pagination}}
```

If `partials/pagination.hbs` exists, Ghost renders that instead of its own
markup. Inside it you get `page`, `pages`, `total`, `prev`, `next`, and
`{{page_url next}}`.

Keep them as real links. Infinite scroll costs the crawler every post past the
first page and breaks the back button, and no amount of client-side cleverness
fully fixes either.

## What to take from this

- `{{#foreach posts}}` for what the route loaded; `{{#get}}` for anything else.
- Empty states go in `{{#get}}`'s `{{else}}`, not deeper inside.
- `include` what you use; every `{{#get}}` is a query.
- Prefer `order` to a nested fallback.

Next: everything you can actually read off a post.
