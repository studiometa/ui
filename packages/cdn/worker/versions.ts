import type { ExactVersion, PackageName, UiPackageIndex, VersionsIndex } from './types.ts';

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
  // Distribution tags are optional and validated only when present: a freshly bootstrapped index, a
  // stable-only release with no main channel yet, or a channel-only index with no stable release are
  // all valid states.
  if (latest !== undefined) {
    if (typeof latest !== 'string') throw new Error('Invalid distribution tags.');
    const latestVersion = parseSemver(latest);
    if (!latestVersion || latestVersion.prerelease || !value.releases.includes(latest)) {
      throw new Error('The latest tag must name a published stable release.');
    }
  }
  // `main` always names an immutable main channel when present.
  if (main !== undefined) {
    if (typeof main !== 'string' || !CHANNEL_PATTERN.test(main) || !value.channels.includes(main)) {
      throw new Error('The main tag must name a published immutable channel.');
    }
  }
  // `next` is tolerant of both shapes so this Worker keeps parsing the currently-live index while a
  // later publish change migrates it: the legacy coupled shape names the same main channel as `main`
  // (`next === main`), and the new decoupled shape names a published release version (the latest
  // prerelease, so any entry of `releases` — prereleases included — is accepted). It stays optional,
  // and no longer has to equal `main`.
  if (next !== undefined) {
    if (typeof next !== 'string') throw new Error('Invalid distribution tags.');
    const isChannel = CHANNEL_PATTERN.test(next) && value.channels.includes(next);
    const isRelease = value.releases.includes(next);
    if (!isChannel && !isRelease) {
      throw new Error('The next tag must name a published immutable channel or release version.');
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

const EMPTY_UI_PACKAGE: UiPackageIndex = { releases: [], channels: [], distTags: {} };

// The additive, optional ui-like packages under schema 2. Each shares the full ui semantics and is
// validated identically when present; when absent (an old index that predates the tree) it defaults
// to an empty package so the index still parses and every route for it cleanly 404s until the
// package is populated by a later publish. This is the two-phase rollout contract: a live index that
// omits one of these keys stays valid, so the Worker can deploy before the tree is published.
const OPTIONAL_UI_PACKAGE_NAMES = ['ui-mapbox', 'ui-autoload'] as const;

export function parseVersionsIndex(value: unknown): VersionsIndex {
  // The index stays schemaVersion 2 so the currently-deployed Worker keeps parsing it. `ui-mapbox`
  // and `ui-autoload` are additive, optional packages: an index predating either tree omits it, so
  // neither is required for a valid schema-2 index.
  if (!isRecord(value) || value.schemaVersion !== 2) {
    throw new Error('Unsupported versions index.');
  }
  if (!isRecord(value.packages)) throw new Error('Invalid packages index.');
  validateUiPackage(value.packages.ui);
  validateJsToolkitPackage(value.packages['js-toolkit']);
  const packages: Record<string, unknown> = { ...value.packages };
  for (const name of OPTIONAL_UI_PACKAGE_NAMES) {
    const pkg = value.packages[name];
    if (pkg === undefined) {
      packages[name] = { ...EMPTY_UI_PACKAGE };
    } else {
      validateUiPackage(pkg);
    }
  }
  return {
    ...(value as Record<string, unknown>),
    packages,
  } as unknown as VersionsIndex;
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

// Immutable channels are namespaced per package under `channels/`. The `ui` channels keep the
// original flat `channels/<id>` layout; every other channel-carrying package (`ui-mapbox`,
// `ui-autoload`) is namespaced as `channels/<package>/<id>` so its snapshots never collide with ui's.
function exactChannel(packageName: PackageName, version: string): ExactVersion {
  const objectPrefix =
    packageName === 'ui' ? `channels/${version}` : `channels/${packageName}/${version}`;
  return { kind: 'channel', version, objectPrefix };
}

/**
 * Resolves a requested version for a ui-like package (`ui`, `ui-mapbox` or `ui-autoload`): exact
 * semver, immutable `main-<sha>` channels, the `latest`/`next`/`main` distribution tags, major and
 * minor aliases, and (via a `latest` request) the versionless default.
 */
function resolveUiLikeVersion(
  index: VersionsIndex,
  packageName: 'ui' | 'ui-mapbox' | 'ui-autoload',
  requested: string,
): ExactVersion | undefined {
  const pkg = index.packages[packageName];
  const parsed = parseSemver(requested);
  if (parsed) {
    return pkg.releases.includes(requested) ? exactRelease(packageName, requested) : undefined;
  }
  if (CHANNEL_PATTERN.test(requested)) {
    return pkg.channels.includes(requested) ? exactChannel(packageName, requested) : undefined;
  }
  if (requested === 'latest') {
    return pkg.distTags.latest ? exactRelease(packageName, pkg.distTags.latest) : undefined;
  }
  if (requested === 'main') {
    const channel = pkg.distTags.main;
    return channel ? exactChannel(packageName, channel) : undefined;
  }
  if (requested === 'next') {
    // `next` may name an immutable channel (legacy coupled shape, `next === main`) or an exact
    // release version (decoupled shape). Resolve it to whichever kind its target names; the two
    // namespaces are disjoint (a channel id never parses as semver), so the check is unambiguous.
    const target = pkg.distTags.next;
    if (!target) return undefined;
    if (CHANNEL_PATTERN.test(target) && pkg.channels.includes(target)) {
      return exactChannel(packageName, target);
    }
    return pkg.releases.includes(target) ? exactRelease(packageName, target) : undefined;
  }

  const alias = ALIAS_PATTERN.exec(requested);
  if (!alias) return undefined;
  const major = BigInt(alias[1]);
  const minor = alias[2] === undefined ? undefined : BigInt(alias[2]);
  const matches = pkg.releases.filter((release) => {
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
  return resolved ? exactRelease(packageName, resolved) : undefined;
}

/**
 * Resolves a requested version for a package. The `ui`, `ui-mapbox` and `ui-autoload` packages keep
 * the full semantics — exact semver, immutable `main-<sha>` channels, the `latest`/`next`/`main`
 * distribution tags, major and minor aliases, and (via a `latest` request) the versionless default.
 * The `js-toolkit` package is exact-version only: it resolves solely to an exact semver present in its
 * release inventory, so every alias, channel, and distribution tag (including `latest` and the
 * versionless default) is a 404.
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
  return resolveUiLikeVersion(index, packageName, requested);
}

/**
 * Resolves the exact version a bare package root redirects to. The `ui` root follows the `latest`
 * distribution tag; the tagless `js-toolkit` root follows its highest published release. Either
 * yields `undefined` when the package has no eligible release yet, which the Worker turns into a
 * 404.
 */
export function resolveBareRoot(
  index: VersionsIndex,
  packageName: PackageName,
): ExactVersion | undefined {
  if (packageName === 'ui' || packageName === 'ui-mapbox' || packageName === 'ui-autoload') {
    return resolveVersion(index, packageName, 'latest');
  }
  const highest = [...index.packages['js-toolkit'].releases].sort(compareStableVersions).at(-1);
  return highest ? exactRelease('js-toolkit', highest) : undefined;
}

/**
 * Returns the highest published stable (non-prerelease) release from a release inventory, or
 * `undefined` when the inventory has no stable release yet.
 */
export function highestStableRelease(releases: readonly string[]): string | undefined {
  const stable = releases.filter((release) => {
    const version = parseSemver(release);
    return version !== undefined && version.prerelease === undefined;
  });
  return [...stable].sort(compareStableVersions).at(-1);
}

/**
 * Resolves the reference the registry reports as the current ui surface: the `latest` stable tag,
 * then the `main` preview channel, then the highest stable release, and finally `null` when the
 * index carries no eligible reference. The result is a ref usable in a `/ui@<ref>/` URL.
 */
export function resolveCurrentUiRef(index: VersionsIndex): string | null {
  const ui = index.packages.ui;
  return ui.distTags.latest ?? ui.distTags.main ?? highestStableRelease(ui.releases) ?? null;
}

/**
 * Resolves the reference the registry reports as the current ui-mapbox surface, using the same
 * fallback ladder as {@link resolveCurrentUiRef}. It is versioned in lockstep with ui, so in a
 * consistent index this equals `resolveCurrentUiRef`, but it is resolved independently so a partial
 * index still degrades gracefully.
 */
export function resolveCurrentUiMapboxRef(index: VersionsIndex): string | null {
  const uiMapbox = index.packages['ui-mapbox'];
  return (
    uiMapbox.distTags.latest ??
    uiMapbox.distTags.main ??
    highestStableRelease(uiMapbox.releases) ??
    null
  );
}

/**
 * Resolves the reference the registry reports as the current ui-autoload surface, using the same
 * fallback ladder as {@link resolveCurrentUiRef}. It is versioned in lockstep with ui, so in a
 * consistent index this equals `resolveCurrentUiRef`, but it is resolved independently so a partial
 * index (one that omits the ui-autoload key entirely, as the currently-live index does) still
 * degrades gracefully to `null`.
 */
export function resolveCurrentUiAutoloadRef(index: VersionsIndex): string | null {
  const uiAutoload = index.packages['ui-autoload'];
  return (
    uiAutoload.distTags.latest ??
    uiAutoload.distTags.main ??
    highestStableRelease(uiAutoload.releases) ??
    null
  );
}

/**
 * Resolves the js-toolkit version the registry reports as current: its highest published release,
 * mirroring the bare-root redirect, or `null` when nothing is published yet.
 */
export function resolveCurrentJsToolkit(index: VersionsIndex): string | null {
  return resolveBareRoot(index, 'js-toolkit')?.version ?? null;
}

export function isMutableVersion(requested: string, resolved: ExactVersion): boolean {
  return requested !== resolved.version;
}
