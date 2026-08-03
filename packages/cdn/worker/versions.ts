import type { ExactVersion, VersionsIndex } from './types.ts';

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const ALIAS_PATTERN = /^(0|[1-9]\d*)(?:\.(0|[1-9]\d*))?$/;
const CHANNEL_PATTERN = /^main-[0-9a-f]{7,40}$/;

interface ParsedSemver {
  major: bigint;
  minor: bigint;
  patch: bigint;
  prerelease?: string;
}

function parseSemver(value: string): ParsedSemver | undefined {
  const match = SEMVER_PATTERN.exec(value);
  if (!match) return undefined;
  return {
    major: BigInt(match[1]),
    minor: BigInt(match[2]),
    patch: BigInt(match[3]),
    prerelease: match[4],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isUniqueStringArray(
  value: unknown,
  validate: (item: string) => boolean,
): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === 'string' && validate(item)) &&
    new Set(value).size === value.length
  );
}

export function parseVersionsIndex(value: unknown): VersionsIndex {
  if (!isRecord(value) || value.schemaVersion !== 1) {
    throw new Error('Unsupported versions index.');
  }
  if (!isUniqueStringArray(value.releases, (item) => parseSemver(item) !== undefined)) {
    throw new Error('Invalid releases index.');
  }
  if (!isUniqueStringArray(value.channels, (item) => CHANNEL_PATTERN.test(item))) {
    throw new Error('Invalid channels index.');
  }
  if (!isRecord(value.distTags)) throw new Error('Invalid distribution tags.');
  const { latest, next, main } = value.distTags;
  // Distribution tags are optional: a freshly bootstrapped index, a stable-only release with no
  // main channel yet, or a channel-only index with no stable release are all valid states. Each
  // tag is validated only when present, and next/main stay coupled whenever either one is set.
  if (latest !== undefined) {
    if (typeof latest !== 'string') throw new Error('Invalid distribution tags.');
    const latestVersion = parseSemver(latest);
    if (!latestVersion || latestVersion.prerelease || !value.releases.includes(latest)) {
      throw new Error('The latest tag must name a published stable release.');
    }
  }
  if (next !== undefined || main !== undefined) {
    if (typeof next !== 'string' || typeof main !== 'string') {
      throw new Error('Invalid distribution tags.');
    }
    if (next !== main || !CHANNEL_PATTERN.test(next) || !value.channels.includes(next)) {
      throw new Error('The next and main tags must name the same published immutable channel.');
    }
  }
  return value as unknown as VersionsIndex;
}

function compareStableVersions(left: string, right: string): number {
  const a = parseSemver(left);
  const b = parseSemver(right);
  if (!a || !b) return 0;
  for (const part of ['major', 'minor', 'patch'] as const) {
    if (a[part] > b[part]) return 1;
    if (a[part] < b[part]) return -1;
  }
  return left.localeCompare(right);
}

function exactRelease(version: string): ExactVersion {
  return { kind: 'release', version, objectPrefix: `releases/${version}` };
}

function exactChannel(version: string): ExactVersion {
  return { kind: 'channel', version, objectPrefix: `channels/${version}` };
}

export function resolveVersion(index: VersionsIndex, requested: string): ExactVersion | undefined {
  const parsed = parseSemver(requested);
  if (parsed) {
    return index.releases.includes(requested) ? exactRelease(requested) : undefined;
  }
  if (CHANNEL_PATTERN.test(requested)) {
    return index.channels.includes(requested) ? exactChannel(requested) : undefined;
  }
  if (requested === 'latest') {
    return index.distTags.latest ? exactRelease(index.distTags.latest) : undefined;
  }
  if (requested === 'next' || requested === 'main') {
    const channel = index.distTags[requested];
    return channel ? exactChannel(channel) : undefined;
  }

  const alias = ALIAS_PATTERN.exec(requested);
  if (!alias) return undefined;
  const major = BigInt(alias[1]);
  const minor = alias[2] === undefined ? undefined : BigInt(alias[2]);
  const matches = index.releases.filter((release) => {
    const version = parseSemver(release);
    return (
      version !== undefined &&
      version.prerelease === undefined &&
      version.major === major &&
      (minor === undefined || version.minor === minor)
    );
  });
  matches.sort(compareStableVersions);
  const resolved = matches.at(-1);
  return resolved ? exactRelease(resolved) : undefined;
}

export function isMutableVersion(requested: string, resolved: ExactVersion): boolean {
  return requested !== resolved.version;
}
