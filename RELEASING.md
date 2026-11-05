# Releasing

The publish pipeline is [`.github/workflows/publish.yml`](.github/workflows/publish.yml):
pushing a tag `v<version>` runs tests, rebuilds the artifacts, checks they are committed,
packs, publishes to npm with provenance, and creates a GitHub Release with the tarball.
Release notes are read from [`publish/release-notes/<tag>.md`](publish/release-notes/) when present,
otherwise generated from commits.

## One-time setup

1. **npx / npm account** owns the `@oi-yao` scope (or create one).
2. **First publish** (before Trusted Publishing exists for a new package), either:
   - publish once from a maintainer machine: `npm login && npm publish --access public`, or
   - add a repository secret `NPM_TOKEN` (granular token with *read and write* on
     `@oi-yao/dsh-inline-visuals`) and run the **Publish** workflow manually with
     `dry_run = false`.
3. **Configure Trusted Publishing** on npmjs.com → package → Settings → Trusted Publisher:
   - Provider: GitHub Actions
   - Repository: `YLifeOnlyOnce/dsh-inline-visuals`
   - Workflow: `publish.yml`
   After this, tag-triggered publishes use OIDC (`id-token: write`) with provenance and no token.
4. Protect the `v*` tags (Settings → Tags) and require the `CI` workflow on `main`.

> Token fallback: if you cannot use Trusted Publishing, add `NPM_TOKEN` as a secret and change the
> publish step to set `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` and drop `--provenance`
> (provenance needs OIDC).

## Cutting a release

```bash
# 1. bump the version (creates a commit and a v<version> tag)
npm version patch        # or minor / major

# 2. push the commit and the tag; the tag triggers the publish workflow
git push --follow-tags
```

The workflow refuses to publish when the tag and `package.json` version disagree, when tests fail,
or when `index.js` / `client.js` drift from `src/`.

## Manual / dry run

Actions → **Publish** → *Run workflow*:

- `dry_run = true` (default): runs tests, build, pack and `npm publish --dry-run` — no upload;
- `dry_run = false`: publishes the current `package.json` version (only useful right after a bump).

## Verify a release

```bash
npm view @oi-yao/dsh-inline-visuals version dist.tarball
npx --yes dsh --version   # or the DSH install you use
```
