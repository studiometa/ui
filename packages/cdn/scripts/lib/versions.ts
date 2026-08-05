const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
// Immutable channels come in two shapes: the rolling `main-<sha>` channel that the next/main
// distribution tags follow, and per-pull-request `pr-<number>-<sha>` preview channels that are
// addressable by their exact id but are never a distribution tag.
const MAIN_CHANNEL_PATTERN = /^main-[0-9a-f]{7,40}$/;
const PREVIEW_CHANNEL_PATTERN = /^pr-[1-9]\d*-[0-9a-f]{7,40}$/;
const CHANNEL_PATTERN = /^(?:main|pr-[1-9]\d*)-[0-9a-f]{7,40}$/;

/**
 * The mutable distribution tags for a ui-like package, mirroring npm's model:
 * - `latest` — the latest stable (non-prerelease) release.
 * - `next` — the latest prerelease release (npm parity), decoupled from `main`. It tracks the
 *   highest published prerelease and never moves backward to an older one. Managed by releases.
 * - `main` — the rolling `main-<sha>` main channel, advanced on every main-branch publish.
 *
 * `next` and `main` are independent: `next` names a prerelease release once one is published, while
 * `main` always names the newest main channel. Before any prerelease exists, a legacy `next` may
 * still name the main channel (the tolerant Worker keeps accepting that shape).
 */
export interface DistributionTags {
  latest?: string;
  next?: string;
  main?: string;
}

export interface UiPackageIndex {
  releases: string[];
  channels: string[];
  distTags: DistributionTags;
}

export interface JsToolkitPackageIndex {
  releases: string[];
}

export type UiLikePackageName = 'ui' | 'ui-mapbox' | 'ui-autoload';

/**
 * Working representation of the schemaVersion 2 `versions.json`. Releases are namespaced per
 * package: `ui`, `ui-mapbox` and `ui-autoload` each keep releases, immutable channels and
 * distribution tags (and are versioned in lockstep with ui); `js-toolkit` is exact-version only and
 * carries just a release inventory. `ui-mapbox` and `ui-autoload` are additive, optional packages: an
 * index predating either tree simply omits it, and it is bootstrapped empty and populated in place
 * under the same schemaVersion 2. They intentionally allow partial distribution tags so the tooling
 * can bootstrap the index before a stable release and a main channel exist. Once fully populated they
 * satisfy the strict schema the Worker validates on read.
 */
export interface WorkingVersionsIndex {
  schemaVersion: 2;
  packages: {
    ui: UiPackageIndex;
    'ui-mapbox': UiPackageIndex;
    'ui-autoload': UiPackageIndex;
    'js-toolkit': JsToolkitPackageIndex;
  };
}

interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

export function parseSemver(value: string): ParsedSemver | undefined {
  const match = SEMVER_PATTERN.exec(value);
  if (!match) return undefined;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4],
  };
}

export function isStableVersion(value: string): boolean {
  const parsed = parseSemver(value);
  return parsed !== undefined && parsed.prerelease === undefined;
}

export function isChannelId(value: string): boolean {
  return CHANNEL_PATTERN.test(value);
}

export function isMainChannelId(value: string): boolean {
  return MAIN_CHANNEL_PATTERN.test(value);
}

export function isPreviewChannelId(value: string): boolean {
  return PREVIEW_CHANNEL_PATTERN.test(value);
}

export function compareStableVersions(left: string, right: string): number {
  const a = parseSemver(left);
  const b = parseSemver(right);
  if (!a || !b) return left.localeCompare(right);
  for (const part of ['major', 'minor', 'patch'] as const) {
    if (a[part] !== b[part]) return a[part] - b[part];
  }
  if ((a.prerelease ?? '') !== (b.prerelease ?? '')) {
    if (a.prerelease === undefined) return 1;
    if (b.prerelease === undefined) return -1;
    return a.prerelease.localeCompare(b.prerelease);
  }
  return 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function emptyIndex(): WorkingVersionsIndex {
  return {
    schemaVersion: 2,
    packages: {
      ui: { releases: [], channels: [], distTags: {} },
      'ui-mapbox': { releases: [], channels: [], distTags: {} },
      'ui-autoload': { releases: [], channels: [], distTags: {} },
      'js-toolkit': { releases: [] },
    },
  };
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function parseUiLikePackage(value: unknown): UiPackageIndex {
  const record = isRecord(value) ? value : {};
  const distTags: DistributionTags = {};
  if (isRecord(record.distTags)) {
    for (const tag of ['latest', 'next', 'main'] as const) {
      const candidate = record.distTags[tag];
      if (typeof candidate === 'string') distTags[tag] = candidate;
    }
  }
  return {
    releases: stringArray(record.releases),
    channels: stringArray(record.channels),
    distTags,
  };
}

/**
 * Parses an existing schemaVersion 2 `versions.json` payload leniently, returning an empty index
 * when the object is absent so a first publication can bootstrap it. Known entries are preserved.
 * A live schema-2 index that predates the ui-mapbox or ui-autoload tree (and therefore omits that
 * key) is accepted and migrated in place: the missing package is initialized empty so this
 * publication can add its release/channel while the index stays schemaVersion 2. A valid schema-2
 * index is never refused.
 */
export function parseWorkingVersionsIndex(text: string | undefined): WorkingVersionsIndex {
  if (text === undefined) return emptyIndex();
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('The existing versions.json is not valid JSON; refusing to overwrite it.');
  }
  if (!isRecord(value) || value.schemaVersion !== 2 || !isRecord(value.packages)) {
    throw new Error(
      'The existing versions.json has an unsupported schema; refusing to overwrite it.',
    );
  }
  const jsToolkit = isRecord(value.packages['js-toolkit']) ? value.packages['js-toolkit'] : {};
  return {
    schemaVersion: 2,
    packages: {
      ui: parseUiLikePackage(value.packages.ui),
      'ui-mapbox': parseUiLikePackage(value.packages['ui-mapbox']),
      'ui-autoload': parseUiLikePackage(value.packages['ui-autoload']),
      'js-toolkit': {
        releases: stringArray(jsToolkit.releases),
      },
    },
  };
}

// Serializes a ui-like package deterministically: releases sorted by semver, channels sorted
// lexically and distribution tags emitted in a stable key order.
function serializeUiLikePackage(pkg: UiPackageIndex): UiPackageIndex {
  const distTags: DistributionTags = {};
  if (pkg.distTags.latest !== undefined) distTags.latest = pkg.distTags.latest;
  if (pkg.distTags.next !== undefined) distTags.next = pkg.distTags.next;
  if (pkg.distTags.main !== undefined) distTags.main = pkg.distTags.main;
  return {
    releases: [...new Set(pkg.releases)].sort(compareStableVersions),
    channels: [...new Set(pkg.channels)].sort(),
    distTags,
  };
}

/**
 * Serializes the index deterministically so published payloads are reproducible: each ui-like
 * package's releases are sorted by semver, channels lexically, and distribution tags in a stable
 * key order, and js-toolkit's releases are sorted by semver.
 */
export function serializeVersionsIndex(index: WorkingVersionsIndex): string {
  const payload = {
    schemaVersion: 2,
    packages: {
      ui: serializeUiLikePackage(index.packages.ui),
      'ui-mapbox': serializeUiLikePackage(index.packages['ui-mapbox']),
      'ui-autoload': serializeUiLikePackage(index.packages['ui-autoload']),
      'js-toolkit': {
        releases: [...new Set(index.packages['js-toolkit'].releases)].sort(compareStableVersions),
      },
    },
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

function withUiLikePackage(
  index: WorkingVersionsIndex,
  packageName: UiLikePackageName,
  update: (pkg: UiPackageIndex) => UiPackageIndex,
): WorkingVersionsIndex {
  return {
    ...index,
    packages: {
      ...index.packages,
      [packageName]: update(index.packages[packageName]),
    },
  };
}

/**
 * Records a release for a ui-like package and advances the release-managed distribution tags:
 * - a stable (non-prerelease) version advances `latest` (npm's latest stable);
 * - a prerelease version advances `next` (npm's latest prerelease), but only forward: `next` moves
 *   to it when there is no current `next`, when the current `next` is a channel id rather than a
 *   published release, or when the version sorts at/after the current `next` target. This keeps
 *   `next` tracking the highest published prerelease and never regresses it to an older one.
 *
 * `main` (the rolling main channel) is never touched here — releases and the main channel are
 * decoupled.
 */
export function addRelease(
  index: WorkingVersionsIndex,
  packageName: UiLikePackageName,
  version: string,
): WorkingVersionsIndex {
  if (parseSemver(version) === undefined) {
    throw new Error(`Refusing to index a non-semver release: ${version}.`);
  }
  return withUiLikePackage(index, packageName, (pkg) => {
    const releases = pkg.releases.includes(version)
      ? [...pkg.releases]
      : [...pkg.releases, version];
    const distTags = { ...pkg.distTags };
    if (isStableVersion(version)) {
      distTags.latest = version;
    } else if (
      distTags.next === undefined ||
      isChannelId(distTags.next) ||
      compareStableVersions(version, distTags.next) >= 0
    ) {
      distTags.next = version;
    }
    return { ...pkg, releases: releases.sort(compareStableVersions), distTags };
  });
}

/**
 * Records an immutable main channel for a ui-like package and advances only its `main` distribution
 * tag to the channel. `next` is no longer advanced here — it tracks the latest published prerelease
 * release (managed by {@link addRelease}) and is left untouched so a channel publish never clobbers
 * a prerelease `next`.
 */
export function addChannel(
  index: WorkingVersionsIndex,
  packageName: UiLikePackageName,
  channelId: string,
): WorkingVersionsIndex {
  if (!isMainChannelId(channelId)) {
    throw new Error(`Refusing to index a malformed main channel identity: ${channelId}.`);
  }
  return withUiLikePackage(index, packageName, (pkg) => {
    const channels = pkg.channels.includes(channelId)
      ? [...pkg.channels]
      : [...pkg.channels, channelId];
    return {
      ...pkg,
      channels: channels.sort(),
      distTags: { ...pkg.distTags, main: channelId },
    };
  });
}

/**
 * Records a per-pull-request `pr-<number>-<sha>` preview channel for a ui-like package. Unlike the
 * rolling main channel, a preview channel is addressable only by its exact id and never becomes a
 * distribution tag, so the `next`/`main` tags (and every stable alias) are left untouched.
 */
export function addPreviewChannel(
  index: WorkingVersionsIndex,
  packageName: UiLikePackageName,
  channelId: string,
): WorkingVersionsIndex {
  if (!isPreviewChannelId(channelId)) {
    throw new Error(`Refusing to index a malformed preview channel identity: ${channelId}.`);
  }
  return withUiLikePackage(index, packageName, (pkg) => {
    const channels = pkg.channels.includes(channelId)
      ? [...pkg.channels]
      : [...pkg.channels, channelId];
    return { ...pkg, channels: channels.sort() };
  });
}

/**
 * Removes a channel from a ui-like package's index (used to prune a pull request's preview channel
 * once the PR is closed). Only `main` is a channel tag now, so if the pruned channel happened to be
 * the `main` target it is cleared; `next` is left alone because it names a prerelease release rather
 * than a channel. (Preview-channel pruning never set `main`, so this branch is mostly defensive.)
 */
export function removeChannel(
  index: WorkingVersionsIndex,
  packageName: UiLikePackageName,
  channelId: string,
): WorkingVersionsIndex {
  return withUiLikePackage(index, packageName, (pkg) => {
    const channels = pkg.channels.filter((channel) => channel !== channelId);
    const distTags = { ...pkg.distTags };
    if (distTags.main === channelId) {
      delete distTags.main;
    }
    return { ...pkg, channels, distTags };
  });
}

/** Records a stable `ui` release, advancing its `latest` tag for a non-prerelease version. */
export function addUiRelease(index: WorkingVersionsIndex, version: string): WorkingVersionsIndex {
  return addRelease(index, 'ui', version);
}

/** Records an immutable `ui` main channel, advancing only its `main` tag. */
export function addUiChannel(index: WorkingVersionsIndex, channelId: string): WorkingVersionsIndex {
  return addChannel(index, 'ui', channelId);
}

/** Records a per-pull-request `ui` preview channel without moving any distribution tag. */
export function addUiPreviewChannel(
  index: WorkingVersionsIndex,
  channelId: string,
): WorkingVersionsIndex {
  return addPreviewChannel(index, 'ui', channelId);
}

/** Removes a `ui` channel from the index, clearing `main` if it named the pruned channel. */
export function removeUiChannel(
  index: WorkingVersionsIndex,
  channelId: string,
): WorkingVersionsIndex {
  return removeChannel(index, 'ui', channelId);
}

/**
 * Records a js-toolkit release in the exact-version-only inventory. js-toolkit has no channels or
 * distribution tags, so nothing else is advanced.
 */
export function addJsToolkitRelease(
  index: WorkingVersionsIndex,
  version: string,
): WorkingVersionsIndex {
  if (parseSemver(version) === undefined) {
    throw new Error(`Refusing to index a non-semver js-toolkit release: ${version}.`);
  }
  const current = index.packages['js-toolkit'].releases;
  const releases = current.includes(version) ? [...current] : [...current, version];
  return {
    ...index,
    packages: {
      ...index.packages,
      'js-toolkit': { releases: releases.sort(compareStableVersions) },
    },
  };
}
