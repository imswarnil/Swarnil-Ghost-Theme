---
title: Members and access
slug: members-and-access
excerpt: Signup, the paywall and Portal — most of which Ghost does for you, provided you do not build your own version of it.
tag: Members
order: 10
---

Memberships are Ghost's reason for existing, and the amount a theme has to do is
smaller than it looks. The common mistake is reimplementing something Ghost
already ships.

## Portal does the hard part

Portal is Ghost's own signup, signin and account interface. It is loaded by
`{{ghost_foot}}`. You trigger it with links:

```hbs
<a href="#/portal/signup">Subscribe</a>
<a href="#/portal/signin">Sign in</a>
<a href="#/portal/account">Account</a>
<a href="javascript:" data-members-signout>Sign out</a>
```

That is the whole integration. Do not build a signup modal. Portal handles
magic links, tiers, Stripe, error states and email verification, and it is
localised and maintained for you.

## Knowing who is reading

```hbs
{{#if @member}}
    {{@member.name}} — {{@member.email}}
{{else}}
    <a href="#/portal/signup">Subscribe</a>
{{/if}}
```

And whether the site has memberships at all:

```hbs
{{#if @site.members_enabled}} … {{/if}}
```

Wrap every newsletter form in that check. A publication that has not turned on
memberships should never be shown a form that cannot work — it is the fastest
way to make a theme feel broken on first install.

## The newsletter form

```hbs
<form data-members-form="subscribe">
    <input type="email" name="email" data-members-email required>
    <button type="submit">Subscribe</button>

    <p class="message message--loading">Sending…</p>
    <p class="message message--success">Check your inbox to confirm.</p>
    <p class="message message--error">That did not work. Try again?</p>
</form>
```

Ghost intercepts the submit, calls the members API, and adds `loading`,
`success` or `error` to the form's class list. It does not write any copy — your
CSS reveals the right message:

```css
.ghost-subscribe__form.success .ghost-subscribe__message--success { display: block; }
```

All three messages must be in the DOM. Rendering them conditionally in
Handlebars will not work, because the state changes client-side after render.

## The paywall

On a members-only post seen by a signed-out reader, `{{content}}` returns the
public preview and stops. `{{access}}` tells you which happened:

```hbs
{{content}}

{{#unless access}}
    <aside class="ghost-gate">
        <h2>This post is for subscribers</h2>
        <a href="#/portal/signup">Subscribe</a>
    </aside>
{{/unless}}
```

Ghost enforces this on the server. The rest of the post is never sent to the
browser, so there is no "view source" workaround — and equally, no way for you
to accidentally leak it.

Show the gate in listings too. A card for a locked post should say so before the
click, not after.

## Tiers

```hbs
{{#get "tiers" as |tiers|}}
    {{#foreach tiers}}
        {{name}} — {{price monthly_price currency=currency}}
    {{/foreach}}
{{/get}}
```

Prices are in the smallest currency unit — 500 means £5.00 — and `{{price}}`
formats them. Do not do the arithmetic yourself.

## What to take from this

- Link to Portal; never rebuild signup.
- Guard everything members-related with `{{#if @site.members_enabled}}`.
- All three form messages live in the DOM; CSS reveals one.
- `{{access}}` is the paywall signal, and it belongs in listings as well as posts.

Next: the files the browser actually downloads.
