---
title: The template hierarchy
slug: template-hierarchy
excerpt: Ghost picks a template by walking a list of filenames from most specific to least. Learn the list and you stop guessing which file to edit.
tag: Foundations
order: 2
template: wide
---

Every request to a Ghost site resolves to one template file. Ghost decides which
by walking a list from most specific to least specific and taking the first file
that exists.

Knowing the list is most of the job. Without it you end up editing `index.hbs`
and wondering why the tag page did not change.

## The lists

**A post at `/my-post/`:**

1. the custom template chosen in the post settings, e.g. `custom-video.hbs`
2. `post-{slug}.hbs` — e.g. `post-my-post.hbs`
3. `post.hbs`
4. `default.hbs`

**A page at `/about/`:**

1. the custom template chosen in the page settings
2. `page-{slug}.hbs` — e.g. `page-about.hbs`
3. `page.hbs`
4. `post.hbs`
5. `default.hbs`

Note step 4: a page falls back to the *post* template. If you have no
`page.hbs`, your pages will render as posts, byline and all.

**A tag archive at `/tag/design/`:**

1. `tag-design.hbs`
2. `tag.hbs`
3. `index.hbs`

**An author archive at `/author/swarnil/`:**

1. `author-swarnil.hbs`
2. `author.hbs`
3. `index.hbs`

**The homepage at `/`:**

1. `home.hbs`
2. `index.hbs`

**An error:**

1. `error-404.hbs` for a 404 specifically
2. `error.hbs` for everything else

## home.hbs is free

That last pair is worth stopping on, because it is commonly misunderstood. If
`home.hbs` exists, Ghost uses it for the homepage automatically. You do **not**
need `routes.yaml` for that.

This theme takes advantage of it: `home.hbs` assembles the lead, the shelves and
the feed, while `index.hbs` stays a plain paginated list and serves `/page/2/`
and the archive. Both work standalone, so a publisher who never touches routing
still gets the full homepage.

## Slug templates are a trap worth knowing

`post-{slug}.hbs` and `tag-{slug}.hbs` are real and they work. They are also
almost always the wrong tool, because the filename hard-codes a slug that a
publisher can rename in the editor without ever suspecting it was load-bearing.

Prefer a custom template. Those show up in a dropdown in Ghost admin, they
survive a slug change, and a publisher can apply one without knowing a theme
file exists. This theme ships three — Wide, Immersive and Video — and no slug
templates at all.

## Seeing it work

The fastest way to internalise the hierarchy is to break it on purpose. Rename
`tag.hbs` to `tag.hbs.off`, reload a tag archive, and watch it fall through to
`index.hbs`. Put it back.

## What to take from this

- One request, one template, chosen by filename from a fixed list.
- Pages fall back to `post.hbs`, which surprises people.
- `home.hbs` needs no routing configuration.
- Prefer custom templates over `{slug}` templates — slugs change.

Next: the language those files are written in.
