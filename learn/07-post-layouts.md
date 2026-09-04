---
title: Post layouts
slug: post-layouts
excerpt: Custom templates, internal tags, and how to offer three layouts without maintaining three copies of the same file.
tag: Layouts
order: 7
template: immersive
featured: true
---

Sooner or later one post needs to look different — a photo essay wants a wider
column, an interview wants its title over the image. Ghost gives you two
mechanisms, and they are good at different things.

## Custom templates

Any file named `custom-{something}.hbs` appears as an option in the post
settings sidebar in Ghost admin, under **Template**. The word after the dash
becomes the label, title-cased.

```
custom-wide.hbs        → "Wide"
custom-immersive.hbs   → "Immersive"
custom-video.hbs       → "Video"
```

A publisher picks one from a dropdown. They never learn that a file exists.

This is the mechanism to reach for. It is discoverable, it survives a slug
change, and it is self-documenting inside the admin panel.

## Internal tags

The other approach is an internal tag — `#wide` — read by the template:

```hbs
{{#has tag="#wide"}} … {{/has}}
```

Internal tags are invisible to readers, so this works. But it is a convention a
publisher has to be *told* about, and telling them means documentation that
someone will not read. Prefer them for behaviour that is not a whole layout:
marking a post as a video so its card gets a play badge, for instance, which is
exactly what this theme uses `#video` for.

## Not maintaining three copies

The obvious implementation is to copy `post.hbs` three times and edit each. Do
that and the three files will drift within a month — a fix to the byline lands
in one and not the others.

Instead, each template is three lines, and they all delegate:

```hbs
{{!-- custom-wide.hbs --}}
{{!< default}}
{{#post}}
    {{> "post-shell" layout="Wide"}}
{{/post}}
```

`post.hbs` does the same thing with the site-wide default:

```hbs
{{#post}}
    {{> "post-shell" layout=@custom.post_layout}}
{{/post}}
```

All the markup lives once, in `partials/post-shell.hbs`, which branches on its
`layout` parameter. A change to the byline lands in every layout at once,
because there is only one byline.

## Degrading a layout

The Immersive layout sets the title over the feature image. What should it do on
a post with no feature image?

Not this:

```hbs
{{!-- a title floating on an empty grey block --}}
<div class="cover" style="background-image: url({{feature_image}})">
```

The template checks, and falls back to the standard header:

```hbs
{{#match layout "Immersive"}}
    {{#unless feature_image}}
        {{> "post-header"}}
    {{/unless}}
{{else}}
    {{> "post-header"}}
{{/match}}
```

Note the nesting rather than a single condition. Ghost has no `and` helper, so
"Immersive **and** has an image" has to be written as two blocks. That is
awkward enough to be worth a comment in the file.

## What to take from this

- Custom templates for whole layouts; internal tags for smaller behaviours.
- Keep the custom templates thin and delegate to one shared partial.
- Every alternate layout needs an answer for its missing ingredient.
- There is no `and` helper. Nest the conditions.

Next: changing what lives at which URL.
