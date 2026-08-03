# Release procedure

This document describes how a browser CDN release is published to the private R2 bucket behind `https://cdn.studiometa.dev`. It describes the intended operator workflow at the contract level: the build output and the `versions.json` index that the Worker consumes are implemented in this package, while the publish tooling (`scripts/publish.ts` and the smoke checks it runs) lands with the release track and is not present in this worktree. No release has been performed; the steps below are the procedure to follow once the account, bucket, DNS, and redistribution approval from [infrastructure](./infrastructure.md) are in place.

Read this together with [infrastructure](./infrastructure.md) (bucket layout, `versions.json` schema, credentials, gates) and [rollback](./rollback.md) (how to move a tag back).

## What a release consists of

A release is two things published in order:

1. **New immutable prefixes** in the bucket holding a complete, verified build — `releases/ui/<version>/` for a stable `@studiometa/ui` release (or `channels/main-<commit>/` for a preview channel), plus the shared `releases/js-toolkit/<jtVersion>/` artifact the ui build imports by URL. The js-toolkit artifact is immutable and published only when its exact version is not already present; an existing one is left untouched.
2. **An updated `versions.json`** (`schemaVersion: 2`) at the bucket root that adds the ui version to `packages.ui.releases` (moving a distribution tag where appropriate) and the js-toolkit version to `packages["js-toolkit"].releases` when new.

The index is the source of truth the Worker reads first. A prefix that exists in the bucket but is absent from `versions.json` is invisible to the Worker; a tag in `versions.json` that names a missing prefix would fail validation. The two must stay consistent, and the index must be updated last.

## Preconditions

Before publishing:

- **Clean, committed source.** The build refuses to produce publishable output when any tracked build source is dirty (see [infrastructure, Build and Publish Gates](./infrastructure.md#build-and-publish-gates)). Release builds run from a clean commit so `build.publishable` is `true`. Never publish output produced with `--allow-dirty`.
- **Release gates resolved.** `build.json` carries `releaseGates.publicMapboxRedistributionReview` recorded as `approved` / `blocksPublicRelease: false` (see [infrastructure, Mapbox Redistribution](./infrastructure.md#mapbox-redistribution)); publishing refuses only a build that reintroduces a blocking, unapproved gate.
- **Publish guard enabled.** The publish tooling is expected to require `CDN_ENABLED=true` so a build cannot reach the public bucket before the environment and approvals exist.
- **Scoped credentials present.** R2 write credentials and the Cloudflare API token described in [infrastructure](./infrastructure.md#required-credentials) are configured in the CI/publish environment, not in source.

## Build

Produce the artifact from a clean commit, from the repository root:

```bash
npm run cdn:build
```

The build writes `packages/cdn/dist/` containing `autoload.js`, `loader.js`, `manifest.js`, their code-split chunks and source maps, the Mapbox stylesheets, the third-party license notices, and the two metadata files `build.json` and `integrity.json`. `integrity.json` lists a SHA-384 digest for every file in the release (including `build.json`); it is the manifest the Worker validates a prefix against. For a byte-stable, reproducible artifact, set `SOURCE_DATE_EPOCH`; otherwise the build derives its timestamp from the `HEAD` commit.

The exact version comes from the package version in `build.json` (`package.version`); a preview channel name is `main-<commit>` using the build commit.

## Publish ordering

The publish step must preserve the append-only, index-last contract:

1. **Upload to a temporary location.** Stage the built files under a non-served temporary key so a partially uploaded release is never reachable through the index.
2. **Verify the upload.** Re-check every file against `integrity.json` (SHA-384) after upload. Confirm the file inventory matches `build.json` outputs. The upload is only considered good if every digest matches.
3. **Copy into the final immutable prefixes.** Move the verified files to `releases/ui/<version>/` (or `channels/main-<commit>/`) and, when the exact js-toolkit version is not yet present, to `releases/js-toolkit/<jtVersion>/`. These prefixes are immutable: each is written once and never overwritten. If a prefix for that exact version already exists, stop — re-publishing an existing version is not allowed (js-toolkit simply keeps its existing artifact). Publish js-toolkit before the ui tree that imports it becomes visible.
4. **Update `versions.json` atomically.** Write a new `schemaVersion: 2` index that adds the ui version to `packages.ui.releases` (or `packages.ui.channels`) and the js-toolkit version to `packages["js-toolkit"].releases`, and, if this ui release should become current, sets the relevant distribution tag. `versions.json` is the only mutable object touched by a release, and it is written as a single object so the Worker never observes a half-updated index. Preserve the schema invariants: `latest` must name a published stable release with no pre-release identifier, and `next` must equal `main` and name a published channel.

Uploading the immutable prefix before touching the index guarantees that every version the index references is already fully present and verified.

## Smoke checks

After the index update, verify the release through the Worker (not just the bucket):

- Fetch the exact URL, e.g. `https://cdn.studiometa.dev/ui@<version>/autoload.js`, and confirm a `200` with `Cache-Control: public, max-age=31536000, immutable`.
- Fetch the alias you moved, e.g. `ui@latest/autoload.js` or `ui@<major>/autoload.js`, and confirm a `307` redirect to the exact URL.
- Confirm `build.json` and `integrity.json` are retrievable under the new prefix and that the integrity digests match.
- Spot-check a code-split component chunk and a source map resolve.

The smoke checks are the release's acceptance test: if any fail, do not advertise the release, and move the affected tag back per [rollback](./rollback.md).

## Append-only policy

Releases only ever add to the bucket:

- Immutable prefixes are written once and never modified or deleted. Correcting a bad release means publishing a new version, not editing an existing prefix.
- Historical releases stay available so exact-pinned consumers keep working indefinitely.
- The only mutable object is `versions.json`, and the only mutable-in-effect surface is the set of distribution tags inside it. Moving a tag is the mechanism both for promoting a new release and for rolling back.
