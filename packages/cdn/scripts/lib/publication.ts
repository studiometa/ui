import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  cacheControlForKey,
  computeSha384,
  contentTypeForKey,
  objectMetadata,
  type ObjectStore,
} from './object-store.ts';
import {
  addChannel,
  addJsToolkitRelease,
  addPreviewChannel,
  addRelease,
  addUiChannel,
  addUiPreviewChannel,
  addUiRelease,
  isChannelId,
  isPreviewChannelId,
  isStableVersion,
  parseSemver,
  parseWorkingVersionsIndex,
  removeChannel,
  removeUiChannel,
  serializeVersionsIndex,
  type WorkingVersionsIndex,
} from './versions.ts';

export type PackageName = 'ui' | 'ui-mapbox' | 'js-toolkit';

const VERSIONS_KEY = 'versions.json';
const FULL_COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const CHANNEL_SHORT_LENGTH = 12;
// A release is a few hundred small objects, each needing a couple of round-trips (put + head, copy
// + head, delete). Uploading them one at a time dominates the publish wall-clock, so each phase
// runs with bounded concurrency. R2 handles far more, but this keeps memory and connection use
// modest while cutting the publish time by roughly this factor.
const UPLOAD_CONCURRENCY = 24;

/**
 * Runs `task` over every item with at most `UPLOAD_CONCURRENCY` in flight. It is fail-fast: on the
 * first rejection it stops starting new tasks, waits for the in-flight ones to settle (so their
 * side effects — e.g. staged objects left for diagnosis — are complete), then rethrows that first
 * error. Phases stay ordered because each call is awaited before the next begins.
 */
async function forEachWithConcurrency<T>(
  items: readonly T[],
  task: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0;
  let firstError: unknown;
  async function worker(): Promise<void> {
    while (index < items.length && firstError === undefined) {
      const item = items[index++];
      try {
        await task(item);
      } catch (error) {
        firstError ??= error;
        return;
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(UPLOAD_CONCURRENCY, items.length) }, () => worker()),
  );
  if (firstError !== undefined) throw firstError;
}

export interface ArtifactFile {
  path: string;
  body: Uint8Array;
  sha384: string;
}

export interface PublishBuildMetadata {
  package: { name: string; version: string };
  dependencies?: Record<string, string>;
  build: { commit: string; clean: boolean; publishable: boolean };
  releaseGates?: {
    publicMapboxRedistributionReview: {
      required: boolean;
      status: string;
      blocksPublicRelease: boolean;
    };
  };
}

export interface Artifact {
  files: ArtifactFile[];
  build: PublishBuildMetadata;
}

/**
 * Reads a built CDN artifact from disk. The file inventory and expected digests come from
 * `integrity.json`; every listed file is re-hashed and checked against the manifest so a corrupt
 * or partial build is rejected before any upload begins. `integrity.json` itself is appended to
 * the upload set (it is excluded from its own inventory by design).
 */
export async function readArtifact(outputDirectory: string): Promise<Artifact> {
  const integrityText = await readFile(resolve(outputDirectory, 'integrity.json'), 'utf8');
  const integrity = JSON.parse(integrityText) as {
    schemaVersion: number;
    algorithm: string;
    files: Record<string, string>;
  };
  if (integrity.schemaVersion !== 1 || integrity.algorithm !== 'sha384') {
    throw new Error('Unsupported integrity manifest.');
  }

  const files: ArtifactFile[] = [];
  for (const [path, expected] of Object.entries(integrity.files)) {
    const body = new Uint8Array(await readFile(resolve(outputDirectory, path)));
    const sha384 = computeSha384(body);
    if (sha384 !== expected) {
      throw new Error(`Artifact file ${path} does not match its recorded integrity digest.`);
    }
    files.push({ path, body, sha384 });
  }
  const integrityBody = new Uint8Array(Buffer.from(integrityText, 'utf8'));
  files.push({ path: 'integrity.json', body: integrityBody, sha384: computeSha384(integrityBody) });

  const buildFile = files.find((file) => file.path === 'build.json');
  if (!buildFile) throw new Error('The artifact is missing build.json.');
  const build = JSON.parse(Buffer.from(buildFile.body).toString('utf8')) as PublishBuildMetadata;
  return { files, build };
}

export interface PublishabilityOptions {
  requireClean: boolean;
}

/**
 * Enforces the release preconditions: a clean, publishable build whose release gates are resolved.
 * Current builds record no release gate (Mapbox is external and no longer redistributed), so this
 * remains a dormant safeguard that still refuses any build reintroducing a blocking, unapproved gate.
 */
export function validatePublishability(
  build: PublishBuildMetadata,
  options: PublishabilityOptions,
): void {
  if (options.requireClean && !build.build.clean) {
    throw new Error('Refusing to publish a dirty build; the working tree had uncommitted sources.');
  }
  if (!build.build.publishable) {
    throw new Error('The build is marked non-publishable.');
  }
  const gate = build.releaseGates?.publicMapboxRedistributionReview;
  if (gate && gate.required && gate.blocksPublicRelease && gate.status !== 'approved') {
    throw new Error(
      'A blocking release gate is unresolved. Record it as approved in the build ' +
        '(releaseGates.publicMapboxRedistributionReview.status = "approved") before publishing.',
    );
  }
}

export type PublishTarget =
  | { kind: 'release'; packageName: PackageName; version: string }
  | { kind: 'channel'; commit: string }
  | { kind: 'preview'; pr: number; commit: string };

export interface PublishOptions {
  now?: number;
  publicationId?: string;
  log?: (message: string) => void;
  /**
   * The lockstep @studiometa/ui-mapbox artifact published alongside a ui publication. Its objects
   * are staged, verified and copied into the ui-mapbox tree before the single versions.json write,
   * and the same index write advances the ui-mapbox package identically to ui (a release, main
   * channel, or preview channel at the same identity). Omitted for js-toolkit publications.
   */
  lockstepUiMapbox?: Artifact;
  /**
   * The lockstep @studiometa/ui-autoload artifact published alongside a ui publication, handled
   * identically to {@link PublishOptions.lockstepUiMapbox}: staged, verified and copied into the
   * ui-autoload tree before the single versions.json write, and advanced to the same identity by
   * that same index write. Omitted for js-toolkit publications.
   */
  lockstepUiAutoload?: Artifact;
}

export interface PublishResult {
  finalPrefix: string;
  identity: string;
  publicationId: string;
  uploadedFiles: string[];
  index: WorkingVersionsIndex;
}

function targetIdentity(target: PublishTarget): { identity: string; finalPrefix: string } {
  if (target.kind === 'release') {
    if (parseSemver(target.version) === undefined) {
      throw new Error(`Invalid semantic version for a stable release: ${target.version}.`);
    }
    return {
      identity: target.version,
      finalPrefix: `releases/${target.packageName}/${target.version}`,
    };
  }
  if (!FULL_COMMIT_PATTERN.test(target.commit)) {
    throw new Error('A channel publication requires a full 40-character commit sha.');
  }
  if (target.kind === 'preview') {
    if (!Number.isInteger(target.pr) || target.pr < 1) {
      throw new Error('A preview channel publication requires a positive pull-request number.');
    }
    const identity = `pr-${target.pr}-${target.commit.slice(0, CHANNEL_SHORT_LENGTH)}`;
    return { identity, finalPrefix: `channels/${identity}` };
  }
  const identity = `main-${target.commit.slice(0, CHANNEL_SHORT_LENGTH)}`;
  return { identity, finalPrefix: `channels/${identity}` };
}

/**
 * Publishes an artifact to an immutable final prefix through a staged, verified upload:
 *
 * 1. every file is uploaded to a temporary prefix and its size and SHA-384 are read back and
 *    verified, so an interrupted or corrupted upload fails before anything becomes visible;
 * 2. files are server-side copied to the immutable final prefix and re-verified;
 * 3. only then is `versions.json` rewritten in a single complete PUT, preserving prior
 *    releases/channels and advancing distribution tags per policy;
 * 4. temporary objects are deleted on success and deliberately left in place on failure.
 *
 * An already-populated immutable prefix is never overwritten: for a channel or preview that is a
 * hard error, but a release re-publish is idempotent — the existing tree is left in place and only
 * the `versions.json` dist-tags are advanced, so re-running a release publish moves its tag.
 */
/**
 * Stages every file of an artifact to a temporary prefix (verifying each read-back), then
 * server-side copies them to the immutable final prefix (re-verifying). Nothing becomes visible
 * until both phases succeed; on any failure the temporary objects are deliberately left for
 * diagnosis. Returns the temporary prefix so the caller can delete it after the index write.
 */
async function stageAndCopyArtifact(
  store: ObjectStore,
  artifact: Artifact,
  finalPrefix: string,
  temporaryPrefix: string,
  identity: string,
  log: (message: string) => void,
): Promise<void> {
  log(`Staging ${artifact.files.length} files for ${identity}.`);
  await forEachWithConcurrency(artifact.files, async (file) => {
    const temporaryKey = `${temporaryPrefix}/${file.path}`;
    await store.put(temporaryKey, file.body, {
      contentType: contentTypeForKey(file.path),
      cacheControl: cacheControlForKey(`${finalPrefix}/${file.path}`),
      metadata: objectMetadata(file.body).metadata,
    });
    const head = await store.head(temporaryKey);
    if (!head || head.size !== file.body.length || head.sha384 !== file.sha384) {
      throw new Error(
        `Staged upload verification failed for ${file.path}; temporary objects were left for diagnosis.`,
      );
    }
  });

  log(`Copying ${identity} into its immutable prefix.`);
  await forEachWithConcurrency(artifact.files, async (file) => {
    const temporaryKey = `${temporaryPrefix}/${file.path}`;
    const finalKey = `${finalPrefix}/${file.path}`;
    await store.copy(temporaryKey, finalKey);
    const head = await store.head(finalKey);
    if (!head || head.size !== file.body.length || head.sha384 !== file.sha384) {
      throw new Error(
        `Final upload verification failed for ${file.path}; temporary objects were left for diagnosis.`,
      );
    }
  });
}

// The additive lockstep trees (`ui-mapbox`, `ui-autoload`) are published in lockstep with ui at the
// same identity. Their releases are namespaced under `releases/<package>/<version>` and their
// channels under `channels/<package>/<id>` so they never collide with the ui tree's
// `releases/ui/<version>` and flat `channels/<id>`.
type LockstepPackageName = 'ui-mapbox' | 'ui-autoload';

function lockstepPrefix(
  packageName: LockstepPackageName,
  target: PublishTarget,
  identity: string,
): string {
  return target.kind === 'release'
    ? `releases/${packageName}/${target.version}`
    : `channels/${packageName}/${identity}`;
}

function advanceLockstep(
  index: WorkingVersionsIndex,
  packageName: LockstepPackageName,
  target: PublishTarget,
  identity: string,
): WorkingVersionsIndex {
  if (target.kind === 'channel') return addChannel(index, packageName, identity);
  if (target.kind === 'preview') return addPreviewChannel(index, packageName, identity);
  return addRelease(index, packageName, target.version);
}

export async function publish(
  store: ObjectStore,
  artifact: Artifact,
  target: PublishTarget,
  options: PublishOptions = {},
): Promise<PublishResult> {
  const log = options.log ?? (() => {});
  const { identity, finalPrefix } = targetIdentity(target);

  if (
    (target.kind === 'channel' || target.kind === 'preview') &&
    artifact.build.build.commit !== target.commit
  ) {
    throw new Error('The build commit does not match the requested channel commit.');
  }
  if (target.kind === 'release' && artifact.build.package.version !== target.version) {
    throw new Error(
      `The build version ${artifact.build.package.version} does not match the release tag ${target.version}.`,
    );
  }

  // The additive lockstep trees are staged, copied and indexed alongside ui in the same atomic
  // versions.json write, in a stable order (ui-mapbox then ui-autoload). Each shares ui's identity.
  const lockstepArtifacts: Array<{ packageName: LockstepPackageName; artifact: Artifact }> = [];
  if (options.lockstepUiMapbox) {
    lockstepArtifacts.push({ packageName: 'ui-mapbox', artifact: options.lockstepUiMapbox });
  }
  if (options.lockstepUiAutoload) {
    lockstepArtifacts.push({ packageName: 'ui-autoload', artifact: options.lockstepUiAutoload });
  }
  for (const { packageName, artifact: lockstepArtifact } of lockstepArtifacts) {
    if (
      (target.kind === 'channel' || target.kind === 'preview') &&
      lockstepArtifact.build.build.commit !== target.commit
    ) {
      throw new Error(
        `The ${packageName} build commit does not match the requested channel commit.`,
      );
    }
    if (target.kind === 'release' && lockstepArtifact.build.package.version !== target.version) {
      throw new Error(
        `The ${packageName} build version ${lockstepArtifact.build.package.version} does not match the release tag ${target.version}.`,
      );
    }
  }

  // Immutable prefixes are written once. A release re-publish is idempotent for the dist-tags: the
  // immutable tree is left untouched (re-uploading it is skipped) but the index is still rewritten
  // below so re-running a publish for an already-published release moves its distribution tag. A
  // channel or preview is commit-addressed and re-publishing one is a mistake, so it still hard-fails.
  const finalAlreadyPublished = (await store.head(`${finalPrefix}/build.json`)) !== undefined;
  const preparedLockstep = await Promise.all(
    lockstepArtifacts.map(async ({ packageName, artifact: lockstepArtifact }) => {
      const prefix = lockstepPrefix(packageName, target, identity);
      return {
        packageName,
        artifact: lockstepArtifact,
        finalPrefix: prefix,
        alreadyPublished: (await store.head(`${prefix}/build.json`)) !== undefined,
      };
    }),
  );
  if (target.kind !== 'release') {
    if (finalAlreadyPublished) {
      throw new Error(`${identity} is already published and immutable; refusing to overwrite it.`);
    }
    for (const tree of preparedLockstep) {
      if (tree.alreadyPublished) {
        throw new Error(
          `${identity} (${tree.packageName}) is already published and immutable; refusing to overwrite it.`,
        );
      }
    }
  }

  const now = options.now ?? Date.now();
  const publicationId = options.publicationId ?? `${identity}-${now}`;
  const temporaryPrefix = `tmp/${publicationId}`;

  if (finalAlreadyPublished) {
    log(`${identity} is already published; skipping its upload and only advancing dist-tags.`);
  } else {
    await stageAndCopyArtifact(store, artifact, finalPrefix, temporaryPrefix, identity, log);
  }
  for (const tree of preparedLockstep) {
    const treeTemporaryPrefix = `tmp/${publicationId}-${tree.packageName}`;
    if (tree.alreadyPublished) {
      log(`${identity} (${tree.packageName}) is already published; skipping its upload.`);
    } else {
      await stageAndCopyArtifact(
        store,
        tree.artifact,
        tree.finalPrefix,
        treeTemporaryPrefix,
        `${identity} (${tree.packageName})`,
        log,
      );
    }
  }

  log('Updating versions.json.');
  const currentIndex = parseWorkingVersionsIndex(await store.getText(VERSIONS_KEY));
  let nextIndex: WorkingVersionsIndex;
  if (target.kind === 'channel') {
    nextIndex = addUiChannel(currentIndex, identity);
  } else if (target.kind === 'preview') {
    nextIndex = addUiPreviewChannel(currentIndex, identity);
  } else if (target.packageName === 'ui') {
    nextIndex = addUiRelease(currentIndex, target.version);
  } else {
    nextIndex = addJsToolkitRelease(currentIndex, target.version);
  }
  for (const tree of preparedLockstep) {
    nextIndex = advanceLockstep(nextIndex, tree.packageName, target, identity);
  }
  const serialized = new Uint8Array(Buffer.from(serializeVersionsIndex(nextIndex), 'utf8'));
  await store.put(VERSIONS_KEY, serialized, {
    contentType: 'application/json; charset=utf-8',
    cacheControl: 'public, max-age=300',
    metadata: objectMetadata(serialized).metadata,
  });

  log('Cleaning up temporary objects.');
  if (!finalAlreadyPublished) {
    await forEachWithConcurrency(artifact.files, (file) =>
      store.delete(`${temporaryPrefix}/${file.path}`),
    );
  }
  for (const tree of preparedLockstep) {
    if (!tree.alreadyPublished) {
      const treeTemporaryPrefix = `tmp/${publicationId}-${tree.packageName}`;
      await forEachWithConcurrency(tree.artifact.files, (file) =>
        store.delete(`${treeTemporaryPrefix}/${file.path}`),
      );
    }
  }

  return {
    finalPrefix,
    identity,
    publicationId,
    uploadedFiles: [
      ...artifact.files.map((file) => file.path),
      ...preparedLockstep.flatMap((tree) =>
        tree.artifact.files.map((file) => `${tree.packageName}/${file.path}`),
      ),
    ],
    index: nextIndex,
  };
}

export type RollbackTarget =
  | { kind: 'release'; version: string }
  | { kind: 'channel'; channelId: string };

export interface RollbackResult {
  index: WorkingVersionsIndex;
}

/**
 * Rolls back a mutable distribution tag to a previously published, indexed target. It only rewrites
 * `versions.json`; it never overwrites or deletes an immutable release or channel object. The
 * `next` and `main` tags are always moved together.
 */
export async function rollback(
  store: ObjectStore,
  target: RollbackTarget,
  options: { log?: (message: string) => void } = {},
): Promise<RollbackResult> {
  const log = options.log ?? (() => {});
  const existing = await store.getText(VERSIONS_KEY);
  if (existing === undefined) {
    throw new Error('No versions.json is published; there is nothing to roll back.');
  }
  const index = parseWorkingVersionsIndex(existing);
  const ui = index.packages.ui;
  const uiMapbox = index.packages['ui-mapbox'];
  const uiAutoload = index.packages['ui-autoload'];

  // ui-mapbox and ui-autoload are versioned in lockstep with ui, so a rollback moves every package's
  // tags together to the same identity and requires all three trees' immutable objects to be present.
  if (target.kind === 'release') {
    if (!isStableVersion(target.version)) {
      throw new Error('The latest tag can only point at a stable, non-prerelease release.');
    }
    for (const [packageName, pkg] of [
      ['ui', ui],
      ['ui-mapbox', uiMapbox],
      ['ui-autoload', uiAutoload],
    ] as const) {
      if (!pkg.releases.includes(target.version)) {
        throw new Error(
          `Release ${target.version} is not indexed for ${packageName}; refusing to roll back to it.`,
        );
      }
      if (
        (await store.head(`releases/${packageName}/${target.version}/build.json`)) === undefined
      ) {
        throw new Error(
          `Release ${target.version} has no immutable ${packageName} objects; refusing to roll back.`,
        );
      }
    }
    ui.distTags.latest = target.version;
    uiMapbox.distTags.latest = target.version;
    uiAutoload.distTags.latest = target.version;
    log(`Rolling the latest tag back to ${target.version}.`);
  } else {
    if (!isChannelId(target.channelId)) {
      throw new Error(`Malformed channel identity: ${target.channelId}.`);
    }
    for (const [packageName, pkg, prefix] of [
      ['ui', ui, `channels/${target.channelId}`],
      ['ui-mapbox', uiMapbox, `channels/ui-mapbox/${target.channelId}`],
      ['ui-autoload', uiAutoload, `channels/ui-autoload/${target.channelId}`],
    ] as const) {
      if (!pkg.channels.includes(target.channelId)) {
        throw new Error(
          `Channel ${target.channelId} is not indexed for ${packageName}; refusing to roll back to it.`,
        );
      }
      if ((await store.head(`${prefix}/build.json`)) === undefined) {
        throw new Error(
          `Channel ${target.channelId} has no immutable ${packageName} objects; refusing to roll back.`,
        );
      }
    }
    ui.distTags.next = target.channelId;
    ui.distTags.main = target.channelId;
    uiMapbox.distTags.next = target.channelId;
    uiMapbox.distTags.main = target.channelId;
    uiAutoload.distTags.next = target.channelId;
    uiAutoload.distTags.main = target.channelId;
    log(`Rolling the next and main tags back to ${target.channelId}.`);
  }

  const serialized = new Uint8Array(Buffer.from(serializeVersionsIndex(index), 'utf8'));
  await store.put(VERSIONS_KEY, serialized, {
    contentType: 'application/json; charset=utf-8',
    cacheControl: 'public, max-age=300',
    metadata: objectMetadata(serialized).metadata,
  });
  return { index };
}

/**
 * Prunes every preview channel belonging to a pull request from `versions.json` so the Worker stops
 * resolving them once the PR is closed. Each push publishes a new immutable `pr-<n>-<sha>` channel,
 * so a PR may own several; this removes all of them by their `pr-<n>-` prefix. Only preview channels
 * are ever removed — never the main channel or a stable release. Like rollback, it only rewrites the
 * index; the immutable channel objects are left in place (they are unreferenced afterwards and can
 * be garbage-collected out of band). Pruning a PR with no indexed channels is a no-op, so the
 * cleanup is safe to re-run.
 */
export async function pruneUiPreviewChannelsForPr(
  store: ObjectStore,
  pr: number,
  options: { log?: (message: string) => void } = {},
): Promise<RollbackResult & { removed: string[] }> {
  const log = options.log ?? (() => {});
  if (!Number.isInteger(pr) || pr < 1) {
    throw new Error(`Refusing to prune with a non-positive pull-request number: ${pr}.`);
  }
  const existing = await store.getText(VERSIONS_KEY);
  if (existing === undefined) {
    throw new Error('No versions.json is published; there is nothing to prune.');
  }
  const index = parseWorkingVersionsIndex(existing);
  const prefix = `pr-${pr}-`;
  // ui, ui-mapbox and ui-autoload share the same lockstep preview channel identities; prune every
  // package's copy of each `pr-<pr>-<sha>` channel. The reported set is the union of ids removed.
  const removed = [
    ...new Set(
      [
        ...index.packages.ui.channels,
        ...index.packages['ui-mapbox'].channels,
        ...index.packages['ui-autoload'].channels,
      ].filter((channel) => channel.startsWith(prefix) && isPreviewChannelId(channel)),
    ),
  ].sort();
  if (removed.length === 0) {
    log(`No preview channels indexed for PR #${pr}; nothing to prune.`);
    return { index, removed };
  }

  let nextIndex = index;
  for (const channelId of removed) {
    nextIndex = removeUiChannel(nextIndex, channelId);
    nextIndex = removeChannel(nextIndex, 'ui-mapbox', channelId);
    nextIndex = removeChannel(nextIndex, 'ui-autoload', channelId);
  }
  const serialized = new Uint8Array(Buffer.from(serializeVersionsIndex(nextIndex), 'utf8'));
  await store.put(VERSIONS_KEY, serialized, {
    contentType: 'application/json; charset=utf-8',
    cacheControl: 'public, max-age=300',
    metadata: objectMetadata(serialized).metadata,
  });
  log(`Pruned ${removed.length} preview channel(s) for PR #${pr}: ${removed.join(', ')}.`);
  return { index: nextIndex, removed };
}
