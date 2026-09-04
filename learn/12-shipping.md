---
title: Shipping a theme
slug: shipping-a-theme
excerpt: Accessibility, SEO, documentation and the two reasons themes are actually rejected from the Ghost Marketplace.
tag: Build
order: 12
---

Passing gscan means a theme installs. It says nothing about whether it is any
good. This is the rest of the bar.

## The two real rejection reasons

Ghost publishes its criteria, and two of them account for most rejections.

**Style.** Flow, hierarchy, balance, contrast, typography, negative space. This
is subjective and they say so, but the standard is high and the feedback is
usually just "no".

**Originality.** In Ghost's own words, there are hundreds — maybe thousands — of
forks of Casper with minor visual tweaks. They are often very nice. They are not
useful to someone browsing the marketplace for the first time.

The practical test: if a decision could be described as "the default theme, but
with X", it is the wrong decision. Not because copying is wrong, but because the
result is invisible in a gallery, which is the only place it will ever be seen.

## Accessibility

Four things, all checkable:

**Alt text on every image.** No exceptions. A decorative image gets `alt=""`, and
that is a decision, not an omission.

**Valid HTML.** One `<h1>` per page, headings that descend without skipping,
landmarks (`<header>`, `<main>`, `<nav>`, `<footer>`) with accessible names
where there is more than one of a kind.

**Keyboard navigation.** Tab through the whole site. Every interactive thing
must be reachable and must show focus. Never remove a focus ring without
replacing it. A horizontally scrolling row needs `tabindex="0"` and a label, or
everything past the fold is unreachable.

**Contrast.** 4.5:1 for body text, 3:1 for large text and interface elements —
in both colour schemes. Dark mode is where this quietly fails.

Native elements do most of this for free. `<dialog>` with `showModal()` gives
focus trapping, Escape-to-close and an inert background; a hand-rolled div does
not, and getting it right is a few hundred lines.

## SEO

Ghost handles almost all of it in `{{ghost_head}}` — canonical URLs, Open Graph,
Twitter cards, JSON-LD, the RSS link. What is left is yours:

- semantic markup, so the structure is legible
- one `<h1>`
- real `<a href>` links to every page, including pagination
- descriptive link text, not "read more"

No tricks. Clean, well-structured markup is the entire strategy.

## Documentation

The marketplace ranks documentation explicitly. A buyer needs to know how to
install the theme, what every custom setting does, how to reproduce the demo,
and where to get help.

Write it before you think you need it. Writing the setup guide is also the
fastest way to find the settings you named badly.

## The checklist

Before submitting:

- [ ] `gscan .` passes with no errors
- [ ] Responsive, tested on a real phone, not just a narrow window
- [ ] Latest two versions of Chrome, Firefox, Safari and Edge
- [ ] Every asset loaded through `{{asset}}`
- [ ] "Published with Ghost" link present
- [ ] A demo on HTTPS, embeddable in an iframe from `*.ghost.org`
- [ ] Every image has `alt`
- [ ] Keyboard-navigable end to end
- [ ] Empty states for: no posts, no feature image, no bio, no tags
- [ ] Base styling for every card the editor can produce
- [ ] Featured posts styled distinctly
- [ ] Tag and author archives that are worth visiting
- [ ] Search, comments and custom settings all supported
- [ ] `README.md` with features and support details
- [ ] `package.json` complete, including `author.email`

## The demo is the submission

Reviewers look at the demo before they look at anything else. Fill it with real
content of real length — long titles, missing images, a post with no tags, a
members-only post. A demo of five perfect posts with identical thumbnails proves
nothing about how the theme behaves on a real site.

That is why this theme's demo content is these lessons: it is genuinely long,
genuinely varied, and it has to be written anyway.

## What to take from this

- gscan is the floor, not the bar.
- Originality and style are what get themes rejected.
- Accessibility is four checkable things; native elements do most of the work.
- Write the documentation early. It will fix your naming.
