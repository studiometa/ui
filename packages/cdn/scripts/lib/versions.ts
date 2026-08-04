const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
// Immutable channels come in two shapes: the rolling `main-<sha>` channel that the next/main
// distribution tags follow, and per-pull-request `pr-<number>-<sha>` preview channels that are
// addressable by their exact id but are never a distribution tag.
const MAIN_CHANNEL_PATTERN = /^main-[0-9a-f]{7,40}$/;
const PREVIEW_CHANNEL_PATTERN = /^pr-[1-9]\d*-[0-9a-f]{7,40}$/;
const CHANNEL_PATTERN = /^(?:main|pr-[1-9]\d*)-[0-9a-f]{7,40}$/;

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

/**
 * Working representation of the schemaVersion 2 `versions.json`. Releases are namespaced per
 * package: `ui` keeps releases, immutable channels and distribution tags; `js-toolkit` is
 * exact-version only and carries just a release inventory. It intentionally allows partial `ui`
 * distribution tags so the tooling can bootstrap the index before a stable release and a main
 * channel exist. Once fully populated it satisfies the strict schema the Worker validates on read.
 */
export interface WorkingVersionsIndex {
  schemaVersion: 2;
  packages: {
    ui: UiPackageIndex;
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
      'js-toolkit': { releases: [] },
    },
  };
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

/**
 * Parses an existing schemaVersion 2 `versions.json` payload leniently, returning an empty index
 * when the object is absent so a first publication can bootstrap it. Known entries are preserved.
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
  const ui = isRecord(value.packages.ui) ? value.packages.ui : {};
  const jsToolkit = isRecord(value.packages['js-toolkit']) ? value.packages['js-toolkit'] : {};
  const distTags: DistributionTags = {};
  if (isRecord(ui.distTags)) {
    for (const tag of ['latest', 'next', 'main'] as const) {
      const candidate = ui.distTags[tag];
      if (typeof candidate === 'string') distTags[tag] = candidate;
    }
  }
  return {
    schemaVersion: 2,
    packages: {
      ui: {
        releases: stringArray(ui.releases),
        channels: stringArray(ui.channels),
        distTags,
      },
      'js-toolkit': {
        releases: stringArray(jsToolkit.releases),
      },
    },
  };
}

/**
 * Serializes the index deterministically: releases sorted by semver, channels sorted lexically and
 * distribution tags emitted in a stable key order. This keeps published payloads reproducible.
 */
export function serializeVersionsIndex(index: WorkingVersionsIndex): string {
  const ui = index.packages.ui;
  const distTags: DistributionTags = {};
  if (ui.distTags.latest !== undefined) distTags.latest = ui.distTags.latest;
  if (ui.distTags.next !== undefined) distTags.next = ui.distTags.next;
  if (ui.distTags.main !== undefined) distTags.main = ui.distTags.main;
  const payload = {
    schemaVersion: 2,
    packages: {
      ui: {
        releases: [...new Set(ui.releases)].sort(compareStableVersions),
        channels: [...new Set(ui.channels)].sort(),
        distTags,
      },
      'js-toolkit': {
        releases: [...new Set(index.packages['js-toolkit'].releases)].sort(compareStableVersions),
      },
    },
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

/**
 * Records a stable ui release. The `latest` distribution tag is advanced only for non-prerelease
 * versions; prereleases are indexed but never become `latest`.
 */
export function addUiRelease(index: WorkingVersionsIndex, version: string): WorkingVersionsIndex {
  if (parseSemver(version) === undefined) {
    throw new Error(`Refusing to index a non-semver release: ${version}.`);
  }
  const ui = index.packages.ui;
  const releases = ui.releases.includes(version) ? [...ui.releases] : [...ui.releases, version];
  const distTags = { ...ui.distTags };
  if (isStableVersion(version)) distTags.latest = version;
  return {
    ...index,
    packages: {
      ...index.packages,
      ui: { ...ui, releases: releases.sort(compareStableVersions), distTags },
    },
  };
}

/**
 * Records an immutable ui main channel and advances the `next` and `main` distribution tags
 * together, as the Worker requires them to always name the same channel.
 */
export function addUiChannel(index: WorkingVersionsIndex, channelId: string): WorkingVersionsIndex {
  if (!isMainChannelId(channelId)) {
    throw new Error(`Refusing to index a malformed main channel identity: ${channelId}.`);
  }
  const ui = index.packages.ui;
  const channels = ui.channels.includes(channelId) ? [...ui.channels] : [...ui.channels, channelId];
  return {
    ...index,
    packages: {
      ...index.packages,
      ui: {
        ...ui,
        channels: channels.sort(),
        distTags: { ...ui.distTags, next: channelId, main: channelId },
      },
    },
  };
}

/**
 * Records a per-pull-request `pr-<number>-<sha>` preview channel. Unlike the rolling main channel,
 * a preview channel is addressable only by its exact id and never becomes a distribution tag, so
 * the `next`/`main` tags (and every stable alias) are left untouched.
 */
export function addUiPreviewChannel(
  index: WorkingVersionsIndex,
  channelId: string,
): WorkingVersionsIndex {
  if (!isPreviewChannelId(channelId)) {
    throw new Error(`Refusing to index a malformed preview channel identity: ${channelId}.`);
  }
  const ui = index.packages.ui;
  const channels = ui.channels.includes(channelId) ? [...ui.channels] : [...ui.channels, channelId];
  return {
    ...index,
    packages: {
      ...index.packages,
      ui: { ...ui, channels: channels.sort() },
    },
  };
}

/**
 * Removes a channel from the index (used to prune a pull request's preview channel once the PR is
 * closed). If the channel happened to be the `next`/`main` target, both tags are cleared together
 * so the Worker's "next and main name the same published channel" invariant is preserved.
 */
export function removeUiChannel(
  index: WorkingVersionsIndex,
  channelId: string,
): WorkingVersionsIndex {
  const ui = index.packages.ui;
  const channels = ui.channels.filter((channel) => channel !== channelId);
  const distTags = { ...ui.distTags };
  if (distTags.next === channelId || distTags.main === channelId) {
    delete distTags.next;
    delete distTags.main;
  }
  return {
    ...index,
    packages: { ...index.packages, ui: { ...ui, channels, distTags } },
  };
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
