# Releasing

How a version of this theme goes from a working tree to something a buyer has.

Four things move together, and the process exists to keep them in step: the
version in `package.json`, the changelog entry, the git tag, and the zip a buyer
downloads. When any one of them disagrees with the others, a support question
becomes unanswerable — "which version are you on?" has no reliable answer.

## The short version

```bash
# 1. Write down what changed, under ## [Unreleased] in CHANGELOG.md
# 2. Cut it
npm run release:patch      # or :minor / :major
# 3. Publish it
git push origin main v1.0.1
```

Everything after the push is automatic.

## What each step does

### `npm run release:<level>`

Runs locally, publishes nothing. It refuses to continue if the working tree is
dirty, if you are not on `main`, if `origin/main` is ahead, or if the
`Unreleased` section of the changelog is empty — each of which would produce a
release nobody could reconstruct later.

Then it bumps `package.json`, moves `Unreleased` into a dated section, rebuilds
the stylesheet and the documentation so the committed assets carry the new
version, commits, and tags.

Nothing is public at this point. If it looks wrong:

```bash
git tag -d v1.0.1 && git reset --hard HEAD~1
```

### `git push origin main v1.0.1`

The tag triggers `.github/workflows/release.yml`, which:

1. checks the tag matches `package.json` — a mismatch here cannot be quietly
   corrected once a release exists, so it fails before publishing anything
2. runs `npm run verify` — build, both linters, gscan
3. runs `npm run zip` — the buyer package
4. takes the release notes from the changelog section for that version
5. publishes a GitHub Release with `swarnil.zip` and `docs.pdf` attached

### Deploying to the demo site

Publishing a release triggers `.github/workflows/deploy-theme.yml`, which
uploads and activates the theme on the Ghost site named by its secrets.

This is a separate workflow on purpose. Building a release is safe and
repeatable; changing a live site is neither.

It needs two repository secrets — **Settings → Secrets and variables → Actions**:

| Secret | Value |
| --- | --- |
| `GHOST_ADMIN_API_URL` | the site origin, e.g. `https://theme.imswarnil.com` |
| `GHOST_ADMIN_API_KEY` | the Admin API key, `<id>:<secret>` |

Both come from Ghost admin → **Settings → Advanced → Integrations → Add custom
integration**. Use the **Admin** API key; the Content key is read-only and
cannot upload a theme.

You can set them from the `.env` you already have, without the values passing
through a browser:

```bash
gh secret set GHOST_ADMIN_API_URL --repo imswarnil/Swarnil-Ghost-Theme \
  --body "$(grep '^API_URL=' .env | cut -d= -f2-)"

gh secret set GHOST_ADMIN_API_KEY --repo imswarnil/Swarnil-Ghost-Theme \
  --body "$(grep '^ADMIN_API_KEY=' .env | cut -d= -f2-)"
```

## Deploying without a release

For pushing work in progress to the demo site:

```bash
npm run deploy
```

Reads `API_URL` and `ADMIN_API_KEY` from `.env`, packages the theme, uploads it
and activates it. Same endpoint as the workflow, same result — it just does not
create a release.

## Choosing the level

For a theme, the boundaries are about what a publisher has to do, not about the
size of the diff:

- **major** — they have to act. A renamed custom setting, a removed template, a
  changed `routes.yaml` contract. Renaming a `select` option counts: the value
  stored on their site stops matching and their layout silently changes.
- **minor** — new settings, templates or layouts. Existing sites unaffected.
- **patch** — fixes and styling corrections that change nothing they configured.

## Before a major release

- [ ] `npm run verify` passes
- [ ] The demo site still looks right after `npm run deploy`
- [ ] Every custom setting still does what `docs/src/03-settings.md` says
- [ ] The changelog names anything a publisher must do by hand
- [ ] Screenshots in `assets/` still match the theme
