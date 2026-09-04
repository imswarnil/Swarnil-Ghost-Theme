---
title: Customising
slug: customising
group: Going further
icon: brush
order: 6
summary: Change fonts, widths and corners from code injection — no theme edits, no lost work on update.
---

Everything below is optional. The theme is designed to be finished as shipped.

## Without touching files

**Settings → Code injection → Site header** takes CSS that loads after the
theme's own. This is the supported way to change things, and it survives theme
updates — edits to the theme files do not.

The theme's whole appearance is driven by custom properties. Override them and
every component follows, in both colour schemes:

```html
<style>
  :root {
    --t-w-prose: 46rem;        /* wider reading column        */
    --t-radius-card: 0.25rem;  /* squarer corners             */
    --t-header-h: 5rem;        /* taller header               */
    --t-bracket-size: 0;       /* turn the viewfinder off     */
  }
</style>
```

Change the accent through **Settings → Design → Brand** rather than in CSS —
the theme derives its hover and focus tints from it, so setting it there keeps
all the states in step.

## A custom font

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root { --t-font-display: 'Fraunces', Georgia, serif; }
</style>
```

Set `--t-font-display` for headlines, `--t-font-body` for body text, and
`--t-font-slate` for the monospaced metadata. Changing all three at once is
usually a mistake — the theme's rhythm depends on the three being distinct.

## Editing the theme

If you do edit the files, the source lives in `assets/css/` and is compiled to
`assets/built/index.css`. Editing the built file directly works until the next
rebuild overwrites it.

```bash
npm install
npm run dev      # watch
npm run test     # gscan, before uploading anything
```

One rule matters more than the rest: **component CSS reads `--t-*` tokens only.**
Those are defined in `assets/css/01-contract/tokens.css` and are the reason
light and dark, and the typeface settings, work at all. Reaching past them to a
raw colour is what makes a customised copy stop responding to its own settings.
