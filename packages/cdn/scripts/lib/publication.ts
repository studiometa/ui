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
  addJsToolkitRelease,
  addUiChannel,
  addUiRelease,
  isChannelId,
  isStableVersion,
  parseSemver,
  parseWorkingVersionsIndex,
  serializeVersionsIndex,
  type WorkingVersionsIndex,
} from './versions.ts';

export type PackageName = 'ui' | 'js-toolkit';

const VERSIONS_KEY = 'versions.json';
const FULL_COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const CHANNEL_SHORT_LENGTH = 12;

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
 * The build records the public Mapbox redistribution review as approved by default; this dormant
 * check still refuses a build that reintroduces a blocking, unapproved gate.
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
  | { kind: 'channel'; commit: string };

export interface PublishOptions {
  now?: number;
  publicationId?: string;
  log?: (message: string) => void;
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
    throw new Error('A main channel publication requires a full 40-character commit sha.');
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
 * An already-populated final prefix is never overwritten.
 */
export async function publish(
  store: ObjectStore,
  artifact: Artifact,
  target: PublishTarget,
  options: PublishOptions = {},
): Promise<PublishResult> {
  const log = options.log ?? (() => {});
  const { identity, finalPrefix } = targetIdentity(target);

  if (target.kind === 'channel' && artifact.build.build.commit !== target.commit) {
    throw new Error('The build commit does not match the requested channel commit.');
  }
  if (target.kind === 'release' && artifact.build.package.version !== target.version) {
    throw new Error(
      `The build version ${artifact.build.package.version} does not match the release tag ${target.version}.`,
    );
  }

  if ((await store.head(`${finalPrefix}/build.json`)) !== undefined) {
    throw new Error(`${identity} is already published and immutable; refusing to overwrite it.`);
  }

  const now = options.now ?? Date.now();
  const publicationId = options.publicationId ?? `${identity}-${now}`;
  const temporaryPrefix = `tmp/${publicationId}`;

  log(`Staging ${artifact.files.length} files for ${identity}.`);
  for (const file of artifact.files) {
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
  }

  log(`Copying ${identity} into its immutable prefix.`);
  for (const file of artifact.files) {
    const temporaryKey = `${temporaryPrefix}/${file.path}`;
    const finalKey = `${finalPrefix}/${file.path}`;
    await store.copy(temporaryKey, finalKey);
    const head = await store.head(finalKey);
    if (!head || head.size !== file.body.length || head.sha384 !== file.sha384) {
      throw new Error(
        `Final upload verification failed for ${file.path}; temporary objects were left for diagnosis.`,
      );
    }
  }

  log('Updating versions.json.');
  const currentIndex = parseWorkingVersionsIndex(await store.getText(VERSIONS_KEY));
  let nextIndex: WorkingVersionsIndex;
  if (target.kind === 'channel') {
    nextIndex = addUiChannel(currentIndex, identity);
  } else if (target.packageName === 'ui') {
    nextIndex = addUiRelease(currentIndex, target.version);
  } else {
    nextIndex = addJsToolkitRelease(currentIndex, target.version);
  }
  const serialized = new Uint8Array(Buffer.from(serializeVersionsIndex(nextIndex), 'utf8'));
  await store.put(VERSIONS_KEY, serialized, {
    contentType: 'application/json; charset=utf-8',
    cacheControl: 'public, max-age=300',
    metadata: objectMetadata(serialized).metadata,
  });

  log('Cleaning up temporary objects.');
  for (const file of artifact.files) {
    await store.delete(`${temporaryPrefix}/${file.path}`);
  }

  return {
    finalPrefix,
    identity,
    publicationId,
    uploadedFiles: artifact.files.map((file) => file.path),
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

  if (target.kind === 'release') {
    if (!isStableVersion(target.version)) {
      throw new Error('The latest tag can only point at a stable, non-prerelease release.');
    }
    if (!ui.releases.includes(target.version)) {
      throw new Error(`Release ${target.version} is not indexed; refusing to roll back to it.`);
    }
    if ((await store.head(`releases/ui/${target.version}/build.json`)) === undefined) {
      throw new Error(`Release ${target.version} has no immutable objects; refusing to roll back.`);
    }
    ui.distTags.latest = target.version;
    log(`Rolling the latest tag back to ${target.version}.`);
  } else {
    if (!isChannelId(target.channelId)) {
      throw new Error(`Malformed channel identity: ${target.channelId}.`);
    }
    if (!ui.channels.includes(target.channelId)) {
      throw new Error(`Channel ${target.channelId} is not indexed; refusing to roll back to it.`);
    }
    if ((await store.head(`channels/${target.channelId}/build.json`)) === undefined) {
      throw new Error(
        `Channel ${target.channelId} has no immutable objects; refusing to roll back.`,
      );
    }
    ui.distTags.next = target.channelId;
    ui.distTags.main = target.channelId;
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
