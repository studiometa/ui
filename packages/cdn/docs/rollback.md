# Rollback procedure

This document describes how to roll back the browser CDN. It describes the intended operator workflow at the contract level; the rollback tooling (`scripts/rollback.ts`) lands with the release track and is not present in this worktree. No release or rollback has been performed. Read it together with [release](./release.md) and [infrastructure](./infrastructure.md).

## Principle: rollback is a distribution-tag move

The bucket is append-only and every release prefix is immutable, so a rollback never deletes or rewrites an artifact. It only rewrites `versions.json` so that a distribution tag points back at an earlier, already-published prefix:

- Roll `latest` back to the previous stable release in `releases`.
- Roll `next` and `main` back to the previous preview channel in `channels` (they must always move together and name the same channel).

Consumers pinned to an exact version (`ui@1.9.0`) or an exact channel (`ui@main-<commit>`) are unaffected by a rollback — those URLs are immutable and keep serving the same bytes. Only the mutable aliases (`ui@latest`, `ui@next`, `ui@main`, and the bare `ui@<major>` / `ui@<major>.<minor>` lookups) change where they resolve. Note that `ui@<major>` and `ui@<major>.<minor>` resolve to the highest matching version in `releases`, so if a bad release must stop being served through those aliases, the release entry itself has to be removed from the index (an index-only change), not just a tag move.

## Steps

Rollback applies to `@studiometa/ui` only: it is the sole package with distribution tags. `js-toolkit` has no tags — it is exact-version only — so there is nothing to roll back for it.

1. **Identify the target.** Choose the known-good version or channel to return to. It must already be listed in `versions.json` under `packages.ui` (`releases` or `channels`); rollback only re-points tags, it never introduces a new prefix.
2. **Rewrite the index atomically.** Publish a new `versions.json` that sets `packages.ui.distTags.latest` (and/or `packages.ui.distTags.next` and `.main` together) to the target, keeping every schema invariant: `latest` names a published stable release with no pre-release identifier, and `next` equals `main` and names a published channel. Write the index as a single object so the Worker never reads a half-updated state.
3. **Purge the mutable cache.** The `307` alias redirects are cached with `max-age=300` (browser) and `s-maxage=3600` (edge). After moving a tag, purge the edge cache for the affected alias URLs (for example `https://cdn.studiometa.dev/ui@latest/autoload.js`) so the edge stops handing out the old redirect before its hour is up. Browsers may still hold a stale redirect for up to five minutes; this is expected and self-heals. Immutable exact URLs need no purge.
4. **Verify through the Worker.** Fetch the alias and confirm the `307` now points at the target exact URL, and that the target `autoload.js` serves `200` with the immutable cache header. Confirm `build.json` under the target prefix reports the expected version.

## Concurrency

`versions.json` is the single mutable object and the arbiter of what is live, so all releases and rollbacks contend on it. Serialize index writes — never let a release and a rollback (or two rollbacks) write the index concurrently, or one can silently clobber the other and leave a tag pointing at the wrong prefix. Use a single release/rollback pipeline, take the current index as the base for the edit, and write the full updated object rather than a partial patch. If two operators might act at once, coordinate so only one index write is in flight.

## Incident cautions

- **Roll back the tag, do not delete the bad prefix.** Deleting or overwriting an immutable prefix breaks exact-pinned consumers and violates the append-only contract. Leave the bad version in place and simply stop pointing tags at it.
- **A rollback does not un-publish a version.** Anyone who pinned the bad exact version keeps getting it. If a release is genuinely unsafe to serve at all, that is a larger incident than a tag move: it needs an explicit decision to remove the entry from `versions.json` (and, only if unavoidable, to remove the prefix), accepting that exact-pinned consumers will then 404.
- **Mind the cache window.** Until the edge purge propagates and browser copies expire (up to five minutes), some clients still follow the pre-rollback redirect. Treat the rollback as effective only after verification against a cold edge.
- **Keep the index valid.** A `versions.json` that violates the schema invariants (a `latest` that is not a published stable release, or `next` and `main` that disagree) fails Worker validation and takes the whole CDN to a `502`. Validate the edited index before publishing it.
