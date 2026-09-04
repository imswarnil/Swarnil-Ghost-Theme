---
title: Routing
slug: routing-in-ghost
excerpt: routes.yaml decides what lives at which URL. It is powerful, it is not part of your theme, and one wrong filter will delete posts from your site.
tag: Routing
order: 8
---

`routes.yaml` maps URLs to templates and content. It is the least understood
part of Ghost theming, partly because of one detail: **it is not installed with
your theme**.

## It ships separately

A publisher uploads `routes.yaml` under **Settings → Labs → Routes**, as a
separate action from installing the theme. Ghost does this deliberately —
routing is site configuration, and replacing it when someone tries a new theme
would break every URL they have.

The consequence for you: **your theme must work correctly without it.** Ship a
`routes.yaml` if it adds something, document it, and make sure everything
degrades gracefully when a buyer never uploads it.

This theme ships one that adds a single route, `/archive/`. The homepage does
not need it, because `home.hbs` is picked up automatically.

## The three sections

```yaml
routes:
  /about/:
    template: about

collections:
  /:
    permalink: /{slug}/
    template: home

taxonomies:
  tag: /tag/{slug}/
  author: /author/{slug}/
```

**`routes`** maps one URL to one template. Optionally with `data:` to bind a
page or post to it.

**`collections`** define paginated groups of posts. Every post belongs to
exactly one collection, and the collection sets its permalink.

**`taxonomies`** set the URL patterns for tag and author archives.

## The filter that eats your posts

This is the mistake worth burning into memory:

```yaml
collections:
  /:
    permalink: /{slug}/
    filter: 'featured:false'    # ← do not do this
```

Every post belongs to exactly one collection, and a post's URL comes from the
collection it belongs to. Filter featured posts out of the only collection and
those posts belong to no collection — so they have **no URL at all**. They
vanish from the site, still listed in admin as published.

If you filter a collection, you must define another collection that catches
everything the first one excluded:

```yaml
collections:
  /featured/:
    permalink: /{slug}/
    filter: 'featured:true'
    template: index
  /:
    permalink: /{slug}/
    template: home
```

## Permalinks

```yaml
permalink: /{slug}/
permalink: /{year}/{month}/{slug}/
permalink: /{primary_tag}/{slug}/
```

Changing a permalink on a live site changes every post URL and breaks every
inbound link. If a theme's routing suggestion changes permalinks, say so in
capitals in your documentation.

## Channels

A `route` with a `controller` becomes a channel — a filtered, paginated list:

```yaml
routes:
  /archive/:
    controller: channel
    template: index
```

Channels do not own permalinks, so they are safe. This is how you add "all posts
in one place" without touching where anything lives.

## What to take from this

- `routes.yaml` is uploaded separately. The theme must work without it.
- A filtered collection with no catch-all leaves posts with no URL.
- Permalink changes break every inbound link to the site.
- Channels are the safe way to add a listing page.

Next: letting a publisher change things without opening a file.
