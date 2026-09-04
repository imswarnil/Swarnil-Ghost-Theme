---
title: Install
slug: install
group: Getting started
icon: download
order: 1
summary: Upload the zip, and the optional routing file. Two steps, both under a minute.
---

Download `swarnil.zip`, then in Ghost admin:

**Settings → Design → Change theme → Upload theme**, and select the zip.

That is the entire installation. The theme bundles everything it needs — there
is nothing to install, compile or configure first.

## Requirements

- Ghost **6.0 or later**. The theme declares this in `package.json`, and Ghost
  refuses the upload on an older version rather than half-working.
- No plugins, no build step, no external services.

## Optional: routing

The theme ships a `routes.yaml` that adds three URLs: `/blog/`, which lists
every post, and `/home/sidebar/` and `/home/full/`, which show the homepage with
its sidebar forced on and off. Ghost keeps routing separate from themes, so this
is a second, deliberate step:

**Settings → Labs → Routes → Upload routes file**

Everything else works without it. The homepage, all post layouts, tags and
author pages need no routing configuration at all — Ghost picks up `home.hbs`
for `/` on its own.

The two `/home/` routes exist so both list layouts can be linked side by side.
They are safe to delete once you have chosen one.

> **Before you upload routes.yaml**, download your current one from the same
> screen. Routing is site-wide, and uploading a new file replaces whatever you
> had.
