import type { ExactVersion, PackageName, VersionsIndex } from './types.ts';

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const ALIAS_PATTERN = /^(0|[1-9]\d*)(?:\.(0|[1-9]\d*))?$/;
// Immutable channels: the rolling `main-<sha>` channel and per-pull-request `pr-<number>-<sha>`
// preview channels. Both are resolvable by their exact id when present in the index; only the main
// channel is ever named by the next/main distribution tags.
const CHANNEL_PATTERN = /^(?:main|pr-[1-9]\d*)-[0-9a-f]{7,40}$/;

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

function validateUiPackage(value: unknown): void {
  if (!isRecord(value)) throw new Error('Invalid ui package index.');
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
}

function validateJsToolkitPackage(value: unknown): void {
  // js-toolkit is exact-version only: an inventory of published releases with no channels or tags.
  if (!isRecord(value)) throw new Error('Invalid js-toolkit package index.');
  if (!isUniqueStringArray(value.releases, (item) => parseSemver(item) !== undefined)) {
    throw new Error('Invalid js-toolkit releases index.');
  }
}

export function parseVersionsIndex(value: unknown): VersionsIndex {
  if (!isRecord(value) || value.schemaVersion !== 2) {
    throw new Error('Unsupported versions index.');
  }
  if (!isRecord(value.packages)) throw new Error('Invalid packages index.');
  validateUiPackage(value.packages.ui);
  validateJsToolkitPackage(value.packages['js-toolkit']);
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

function exactRelease(packageName: PackageName, version: string): ExactVersion {
  return { kind: 'release', version, objectPrefix: `releases/${packageName}/${version}` };
}

function exactChannel(version: string): ExactVersion {
  return { kind: 'channel', version, objectPrefix: `channels/${version}` };
}

/**
 * Resolves a requested version for a package. The `ui` package keeps the full semantics — exact
 * semver, immutable `main-<sha>` channels, the `latest`/`next`/`main` distribution tags, major and
 * minor aliases, and (via a `latest` request) the versionless default. The `js-toolkit` package is
 * exact-version only: it resolves solely to an exact semver present in its release inventory, so
 * every alias, channel, and distribution tag (including `latest` and the versionless default) is a
 * 404.
 */
export function resolveVersion(
  index: VersionsIndex,
  packageName: PackageName,
  requested: string,
): ExactVersion | undefined {
  if (packageName === 'js-toolkit') {
    if (parseSemver(requested) === undefined) return undefined;
    return index.packages['js-toolkit'].releases.includes(requested)
      ? exactRelease('js-toolkit', requested)
      : undefined;
  }

  const ui = index.packages.ui;
  const parsed = parseSemver(requested);
  if (parsed) {
    return ui.releases.includes(requested) ? exactRelease('ui', requested) : undefined;
  }
  if (CHANNEL_PATTERN.test(requested)) {
    return ui.channels.includes(requested) ? exactChannel(requested) : undefined;
  }
  if (requested === 'latest') {
    return ui.distTags.latest ? exactRelease('ui', ui.distTags.latest) : undefined;
  }
  if (requested === 'next' || requested === 'main') {
    const channel = ui.distTags[requested];
    return channel ? exactChannel(channel) : undefined;
  }

  const alias = ALIAS_PATTERN.exec(requested);
  if (!alias) return undefined;
  const major = BigInt(alias[1]);
  const minor = alias[2] === undefined ? undefined : BigInt(alias[2]);
  const matches = ui.releases.filter((release) => {
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
  return resolved ? exactRelease('ui', resolved) : undefined;
}

export function isMutableVersion(requested: string, resolved: ExactVersion): boolean {
  return requested !== resolved.version;
}
