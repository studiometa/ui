# Local development and commands

Operational reference for building and testing the browser CDN package (`@studiometa/ui-cdn`) locally. Run everything from the repository root unless noted; the root exposes `cdn:*` wrappers around the package's own scripts. Install dependencies first with `npm install` at the root (the CDN package depends on the workspace's `@studiometa/ui` and `@studiometa/ui-mapbox`).

## Build

```bash
# Build the CDN artifact into packages/cdn/dist
npm run cdn:build
```

The build refuses to run against a dirty working tree of tracked build sources and marks the output non-publishable. For a local build against uncommitted changes, invoke the package script directly with `--allow-dirty` (never publish that output):

```bash
npm run build -w @studiometa/ui-cdn -- --allow-dirty
```

Set `SOURCE_DATE_EPOCH` for a reproducible, byte-stable build; otherwise the timestamp is derived from the `HEAD` commit.

## Manifest

Each component package owns its own catalog (`packages/ui/catalog.ts`, `packages/ui-mapbox/catalog.ts`) and its generated manifest (`packages/ui/manifest.ts`, `packages/ui-mapbox/manifest.ts`). The CDN composes those manifests in `src/manifest.ts` and no longer keeps a bespoke catalog. Regenerate the manifests from the repository root after changing a catalog, and check them in CI:

```bash
npm run manifest:generate   # rewrite every package manifest
npm run manifest:check      # fail if any manifest is out of date
```

## Unit tests (Vitest)

```bash
npm run cdn:test              # full CDN unit suite (autoload, loader, manifest, build, worker)
npm run cdn:test:build        # build-contract test only
npm run cdn:test:worker       # Worker request-handling tests only
npm run cdn:test:watch        # watch mode
```

The Worker suite exercises the request handler (`worker/index.ts`) directly with fixtures, so it needs no live Cloudflare environment.

## Browser tests (Playwright)

The browser suite builds the CDN (with `--allow-dirty`) and drives real component loading in a browser via Playwright:

```bash
npm run cdn:test:browser
```

Playwright needs a browser binary. Install Chromium (and its system dependencies) once before the first run:

```bash
npm exec playwright -- install --with-deps chromium
```

## Worker (Cloudflare)

The Worker is configured in `packages/cdn/wrangler.jsonc` (`name: studiometa-ui-cdn`, entry `worker/index.ts`, R2 binding `ASSETS` → `studiometa-ui-cdn-assets`). Its behavior is covered locally by the Vitest Worker suite above. Running or deploying the real Worker uses Wrangler, which is not a dependency of this package, so invoke it through `npx` from `packages/cdn`:

```bash
cd packages/cdn
npx wrangler dev      # run the Worker locally (needs an ASSETS R2 binding to resolve)
npx wrangler deploy   # deploy — gated on the account, bucket, and approvals in infrastructure.md
```

No Cloudflare environment is provisioned yet (see [infrastructure, Deployment Status](./infrastructure.md#deployment-status)); `wrangler dev` requires a bucket bound to `ASSETS` to resolve requests, and deployment is subject to the credentials and gates described in [infrastructure](./infrastructure.md) and [release](./release.md).

## Lint

Repository-wide linting (oxlint, type-check, and Prettier for `packages/docs`) runs from the root:

```bash
npm run lint
```
