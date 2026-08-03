const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const CHANNEL_PATTERN = /^main-[0-9a-f]{7,40}$/;

export interface DistributionTags {
  latest?: string;
  next?: string;
  main?: string;
}

/**
 * Working representation of `versions.json`. It intentionally allows partial distribution tags so
 * the tooling can bootstrap the index before both a stable release and a main channel exist. Once
 * fully populated it satisfies the strict schema the Worker validates on read.
 */
export interface WorkingVersionsIndex {
  schemaVersion: 1;
  releases: string[];
  channels: string[];
  distTags: DistributionTags;
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

/**
 * Parses an existing `versions.json` payload leniently, returning an empty index when the object
 * is absent or unreadable so a first publication can bootstrap it. Known entries are preserved.
 */
export function parseWorkingVersionsIndex(text: string | undefined): WorkingVersionsIndex {
  const empty: WorkingVersionsIndex = {
    schemaVersion: 1,
    releases: [],
    channels: [],
    distTags: {},
  };
  if (text === undefined) return empty;
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('The existing versions.json is not valid JSON; refusing to overwrite it.');
  }
  if (!isRecord(value) || value.schemaVersion !== 1) {
    throw new Error(
      'The existing versions.json has an unsupported schema; refusing to overwrite it.',
    );
  }
  const releases = Array.isArray(value.releases)
    ? value.releases.filter((item): item is string => typeof item === 'string')
    : [];
  const channels = Array.isArray(value.channels)
    ? value.channels.filter((item): item is string => typeof item === 'string')
    : [];
  const distTags: DistributionTags = {};
  if (isRecord(value.distTags)) {
    for (const tag of ['latest', 'next', 'main'] as const) {
      const candidate = value.distTags[tag];
      if (typeof candidate === 'string') distTags[tag] = candidate;
    }
  }
  return { schemaVersion: 1, releases, channels, distTags };
}

/**
 * Serializes the index deterministically: releases sorted by semver, channels sorted lexically and
 * distribution tags emitted in a stable key order. This keeps published payloads reproducible.
 */
export function serializeVersionsIndex(index: WorkingVersionsIndex): string {
  const releases = [...new Set(index.releases)].sort(compareStableVersions);
  const channels = [...new Set(index.channels)].sort();
  const distTags: DistributionTags = {};
  if (index.distTags.latest !== undefined) distTags.latest = index.distTags.latest;
  if (index.distTags.next !== undefined) distTags.next = index.distTags.next;
  if (index.distTags.main !== undefined) distTags.main = index.distTags.main;
  return `${JSON.stringify({ schemaVersion: 1, releases, channels, distTags }, null, 2)}\n`;
}

/**
 * Records a stable release in the index. The `latest` distribution tag is advanced only for
 * non-prerelease versions; prereleases are indexed but never become `latest`.
 */
export function addRelease(index: WorkingVersionsIndex, version: string): WorkingVersionsIndex {
  if (parseSemver(version) === undefined) {
    throw new Error(`Refusing to index a non-semver release: ${version}.`);
  }
  const releases = index.releases.includes(version)
    ? [...index.releases]
    : [...index.releases, version];
  const distTags = { ...index.distTags };
  if (isStableVersion(version)) distTags.latest = version;
  return { ...index, releases: releases.sort(compareStableVersions), distTags };
}

/**
 * Records an immutable main channel and advances the `next` and `main` distribution tags together,
 * as the Worker requires them to always name the same channel.
 */
export function addChannel(index: WorkingVersionsIndex, channelId: string): WorkingVersionsIndex {
  if (!isChannelId(channelId)) {
    throw new Error(`Refusing to index a malformed channel identity: ${channelId}.`);
  }
  const channels = index.channels.includes(channelId)
    ? [...index.channels]
    : [...index.channels, channelId];
  return {
    ...index,
    channels: channels.sort(),
    distTags: { ...index.distTags, next: channelId, main: channelId },
  };
}
