import {
  canonicalizeQuery,
  parsePackageRoot,
  parseRoute,
  RequestValidationError,
} from './queries.ts';
import {
  contentType,
  errorResponse,
  etagMatches,
  IMMUTABLE_CACHE_CONTROL,
  MUTABLE_CACHE_CONTROL,
  optionsResponse,
  redirectResponse,
  responseHeaders,
} from './responses.ts';
import { buildRegistry } from './registry.ts';
import type {
  BuildMetadata,
  ExactVersion,
  IntegrityMetadata,
  PackageName,
  PackageRoot,
  R2BucketLike,
  R2ObjectBodyLike,
  VersionsIndex,
  WorkerEnvironment,
} from './types.ts';
import {
  isMutableVersion,
  parseVersionsIndex,
  resolveBareRoot,
  resolveCurrentJsToolkit,
  resolveCurrentUiMapboxRef,
  resolveCurrentUiRef,
  resolveVersion,
} from './versions.ts';
import { classifyVersion, emitObservation, ObservationRecorder } from './observability.ts';

const MAX_LINK_HEADER_BYTES = 7_500;
// Each versioned package tree carries its own build identity so a release prefix can only be
// validated against the package it claims to belong to.
const PUBLIC_PACKAGE_NAMES: Record<PackageName, string> = {
  ui: '@studiometa/ui-cdn',
  'ui-mapbox': '@studiometa/ui-cdn-mapbox',
  'js-toolkit': '@studiometa/ui-cdn-js-toolkit',
};
const SAFE_METADATA_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.?(?:\/|$))(?!.*\\)[0-9A-Za-z._@+/-]+$/;

// The npm packages a CDN component may belong to. The registry maps each component's packageName
// straight into its reported owner, so an unexpected value must be rejected rather than surfaced.
const COMPONENT_PACKAGE_NAMES = new Set(['@studiometa/ui', '@studiometa/ui-mapbox']);

interface ReleaseMetadata {
  build: BuildMetadata;
  integrity: IntegrityMetadata;
  files: ReadonlySet<string>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function readJsonObject(bucket: R2BucketLike, key: string): Promise<unknown | undefined> {
  const object = await bucket.get(key);
  if (!object) return undefined;
  return JSON.parse(await object.text()) as unknown;
}

function validGraph(
  value: unknown,
  files: ReadonlySet<string>,
  entryKey: 'entry' | 'path',
): boolean {
  if (!isRecord(value) || typeof value[entryKey] !== 'string' || !Array.isArray(value.preload)) {
    return false;
  }
  const paths = [value[entryKey], ...value.preload];
  return paths.every(
    (path) => typeof path === 'string' && SAFE_METADATA_PATH.test(path) && files.has(path),
  );
}

function parseReleaseMetadata(
  buildValue: unknown,
  integrityValue: unknown,
  exact: ExactVersion,
  expectedPackageName: string,
): ReleaseMetadata | undefined {
  if (
    !isRecord(integrityValue) ||
    integrityValue.schemaVersion !== 1 ||
    integrityValue.algorithm !== 'sha384' ||
    !Array.isArray(integrityValue.excludes) ||
    !integrityValue.excludes.includes('integrity.json') ||
    !isRecord(integrityValue.files)
  ) {
    throw new Error('Invalid integrity metadata.');
  }
  const integrityEntries = Object.entries(integrityValue.files);
  if (
    integrityEntries.some(
      ([path, digest]) =>
        !SAFE_METADATA_PATH.test(path) ||
        typeof digest !== 'string' ||
        !/^sha384-[A-Za-z0-9+/]+={0,2}$/.test(digest),
    )
  ) {
    throw new Error('Invalid integrity file inventory.');
  }
  const files = new Set(integrityEntries.map(([path]) => path));
  files.add('integrity.json');

  if (
    !isRecord(buildValue) ||
    buildValue.schemaVersion !== 1 ||
    !isRecord(buildValue.package) ||
    buildValue.package.name !== expectedPackageName ||
    typeof buildValue.package.version !== 'string' ||
    !isRecord(buildValue.entries) ||
    !isRecord(buildValue.components) ||
    !isRecord(buildValue.outputs) ||
    !files.has('build.json')
  ) {
    throw new Error('Invalid build metadata.');
  }
  if (exact.kind === 'release' && buildValue.package.version !== exact.version) return undefined;
  const outputPaths = Object.keys(buildValue.outputs);
  if (outputPaths.some((path) => !SAFE_METADATA_PATH.test(path) || !files.has(path))) {
    throw new Error('The release output inventory is incomplete.');
  }
  if (Object.values(buildValue.entries).some((entry) => !validGraph(entry, files, 'path'))) {
    throw new Error('Invalid build entry graph.');
  }
  if (
    Object.values(buildValue.components).some(
      (component) =>
        !validGraph(component, files, 'entry') ||
        !isRecord(component) ||
        typeof component.strategy !== 'string' ||
        // packageName and subpath feed the registry's component URLs, so a readable but malformed
        // build.json must be rejected rather than surfacing a wrong owner (`not-a-package`) or an
        // unsafe URL (`../other.js`). The package name must be a known component package and the
        // subpath a safe relative path (SAFE_METADATA_PATH forbids traversal and backslashes).
        typeof component.packageName !== 'string' ||
        !COMPONENT_PACKAGE_NAMES.has(component.packageName) ||
        typeof component.subpath !== 'string' ||
        !SAFE_METADATA_PATH.test(component.subpath),
    )
  ) {
    throw new Error('Invalid component graph.');
  }

  return {
    build: buildValue as unknown as BuildMetadata,
    integrity: integrityValue as unknown as IntegrityMetadata,
    files: new Set([...outputPaths, 'build.json', 'integrity.json']),
  };
}

async function loadRelease(
  bucket: R2BucketLike,
  exact: ExactVersion,
  expectedPackageName: string,
): Promise<ReleaseMetadata | undefined> {
  const [build, integrity] = await Promise.all([
    readJsonObject(bucket, `${exact.objectPrefix}/build.json`),
    readJsonObject(bucket, `${exact.objectPrefix}/integrity.json`),
  ]);
  if (build === undefined || integrity === undefined) return undefined;
  return parseReleaseMetadata(build, integrity, exact, expectedPackageName);
}

// Maps a requested asset path to the served output it names, driven purely by the release's
// `build.json` outputs (carried in `metadata.files`). An exact output is served as-is; otherwise an
// extensionless request is resolved to `<path>.js` (e.g. `Action` -> `Action.js`) or, failing that,
// `<path>/index.js` (e.g. `utils` -> `utils/index.js`). This is generic: it works for `ui`,
// `ui-mapbox`, `js-toolkit`, and any future package without code change. Returns `undefined` (a 404)
// when none of the three candidates is a served output.
function resolveAsset(assetPath: string, files: ReadonlySet<string>): string | undefined {
  if (files.has(assetPath)) return assetPath;
  const withJs = `${assetPath}.js`;
  if (files.has(withJs)) return withJs;
  const withIndex = `${assetPath}/index.js`;
  if (files.has(withIndex)) return withIndex;
  return undefined;
}

function canonicalLocation(
  url: URL,
  packageName: PackageName,
  exactVersion: string,
  assetPath: string,
  search: string,
): string {
  return `${url.origin}/${packageName}@${exactVersion}/${assetPath}${search}`;
}

function preloadHeader(
  packageName: PackageName,
  exactVersion: string,
  components: readonly string[],
  metadata: ReleaseMetadata,
): string | undefined {
  const requested = components.map((token) => metadata.build.components[token]);
  const paths = new Set<string>();
  for (const component of requested) paths.add(component.entry);
  for (const component of requested) {
    for (const path of component.preload) paths.add(path);
  }

  const links: string[] = [];
  let length = 0;
  for (const path of paths) {
    if (!metadata.files.has(path)) continue;
    const link = `</${packageName}@${exactVersion}/${path}>; rel=modulepreload`;
    const nextLength = length + (links.length > 0 ? 2 : 0) + link.length;
    if (nextLength > MAX_LINK_HEADER_BYTES) break;
    links.push(link);
    length = nextLength;
  }
  return links.length > 0 ? links.join(', ') : undefined;
}

function objectEtag(object: R2ObjectBodyLike): string | undefined {
  if (object.httpEtag) return object.httpEtag;
  if (!object.etag) return undefined;
  return object.etag.startsWith('"') ? object.etag : `"${object.etag}"`;
}

async function readVersionsForRegistry(
  bucket: R2BucketLike,
  recorder: ObservationRecorder,
): Promise<VersionsIndex | undefined> {
  // The registry must stay available even when the index is missing, corrupt, or unreadable, so a
  // failure here degrades to an empty registry rather than the 502 an asset request would return.
  try {
    const indexValue = await readJsonObject(bucket, 'versions.json');
    recorder.r2('index', indexValue === undefined ? 'miss' : 'hit');
    return indexValue === undefined ? undefined : parseVersionsIndex(indexValue);
  } catch {
    recorder.r2('index', 'miss');
    return undefined;
  }
}

async function handleRegistry(
  request: Request,
  environment: WorkerEnvironment,
  origin: string,
  recorder: ObservationRecorder,
): Promise<Response> {
  recorder.routeKind('registry');
  const versions = await readVersionsForRegistry(environment.ASSETS, recorder);
  const currentUiRef = versions ? resolveCurrentUiRef(versions) : null;
  const currentUiMapboxRef = versions ? resolveCurrentUiMapboxRef(versions) : null;
  const currentJsToolkit = versions ? resolveCurrentJsToolkit(versions) : null;

  async function loadCurrentBuild(
    packageName: 'ui' | 'ui-mapbox',
    ref: string | null,
  ): Promise<BuildMetadata | undefined> {
    if (!versions || !ref) return undefined;
    const exact = resolveVersion(versions, packageName, ref);
    if (!exact) return undefined;
    try {
      const metadata = await loadRelease(
        environment.ASSETS,
        exact,
        PUBLIC_PACKAGE_NAMES[packageName],
      );
      recorder.r2('release-metadata', metadata ? 'hit' : 'miss');
      return metadata?.build;
    } catch {
      // An unreadable release manifest drops that package's components but keeps the registry.
      recorder.r2('release-metadata', 'miss');
      return undefined;
    }
  }

  const currentUiBuild = await loadCurrentBuild('ui', currentUiRef);
  const currentUiMapboxBuild = await loadCurrentBuild('ui-mapbox', currentUiMapboxRef);

  const registry = buildRegistry({
    origin,
    versions,
    currentUiRef,
    currentUiMapboxRef,
    currentJsToolkit,
    currentUiBuild,
    currentUiMapboxBuild,
  });
  const headers = responseHeaders({
    'Cache-Control': MUTABLE_CACHE_CONTROL,
    'Content-Type': 'application/json; charset=utf-8',
  });
  const body = request.method === 'HEAD' ? null : JSON.stringify(registry);
  return new Response(body, { status: 200, headers });
}

async function handleRequest(
  request: Request,
  environment: WorkerEnvironment,
  recorder: ObservationRecorder,
): Promise<Response> {
  if (request.method === 'OPTIONS') {
    recorder.routeKind('preflight');
    return optionsResponse();
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    recorder.routeKind('method-not-allowed');
    return errorResponse(405);
  }

  const url = new URL(request.url);
  // The CDN root is the JSON registry of everything published; it runs before route parsing so a
  // bare `/` returns the registry instead of being rejected as a malformed asset path.
  if (url.pathname === '/') {
    return handleRegistry(request, environment, url.origin, recorder);
  }

  const packageRoot = parsePackageRoot(url.pathname);
  // Validate an asset route up front so a malformed path is rejected before any storage access; a
  // package root (bare or ref-carrying) skips validation and resolves against the index below.
  const route = packageRoot === undefined ? parseRoute(url.pathname) : undefined;

  const indexValue = await readJsonObject(environment.ASSETS, 'versions.json');
  if (indexValue === undefined) {
    recorder.r2('index', 'miss');
    return errorResponse(502);
  }
  recorder.r2('index', 'hit');
  const versions = parseVersionsIndex(indexValue);

  if (route === undefined) {
    // A package root redirects to its `index.js` barrel — the natural landing for every package.
    const { packageName, ref } = packageRoot as PackageRoot;
    if (ref === undefined) {
      // The bare form (`/ui`, `/ui-mapbox`, `/js-toolkit`) follows the package default: `ui` and
      // `ui-mapbox` their `latest` stable barrel, the tagless `js-toolkit` its highest published
      // barrel. It classifies as a dist-tag hop — a moving pointer resolved to an exact version.
      const resolved = resolveBareRoot(versions, packageName);
      recorder.versionKind(classifyVersion(resolved ? 'latest' : undefined, resolved));
      if (!resolved) return errorResponse(404);
      return redirectResponse(`${url.origin}/${packageName}@${resolved.version}/index.js`);
    }
    // A ref-carrying root (`/ui@next`, `/ui@1.2.0`, `/ui@main`) resolves exactly like an asset
    // request's ref — `latest`/`next`/`main`, an exact release or channel, or a major/minor alias —
    // and 404s when the ref names nothing (e.g. `/js-toolkit@main`, which has no channels).
    const exact = resolveVersion(versions, packageName, ref);
    recorder.versionKind(classifyVersion(ref, exact));
    if (!exact) return errorResponse(404);
    return redirectResponse(`${url.origin}/${packageName}@${exact.version}/index.js`);
  }

  // A versionless request resolves its version the same way a bare package root does, so every
  // package — including the tagless `js-toolkit`, which has no `latest` tag — lands on a usable exact
  // version. An explicit `@latest`/`@<version>`/`@<channel>` keeps the full resolution semantics.
  const exact = route.versionless
    ? resolveBareRoot(versions, route.packageName)
    : resolveVersion(versions, route.packageName, route.requestedVersion);
  recorder.versionKind(classifyVersion(route.requestedVersion, exact));
  if (!exact) return errorResponse(404);

  const metadata = await loadRelease(
    environment.ASSETS,
    exact,
    PUBLIC_PACKAGE_NAMES[route.packageName],
  );
  recorder.r2('release-metadata', metadata ? 'hit' : 'miss');
  if (!metadata) return errorResponse(404);
  // Map the requested path to a served output, resolving an extensionless subpath (`Action`,
  // `utils`) to its `.js` or `/index.js` output. A path that names no output is a 404.
  const assetPath = resolveAsset(route.assetPath, metadata.files);
  if (!assetPath) return errorResponse(404);

  const query = canonicalizeQuery(url, assetPath, new Set(Object.keys(metadata.build.components)));
  recorder.componentCount(query.components.length);
  // Redirect to canonicalize a request; otherwise serve it directly. A mutable ref (versionless, or a
  // moving tag like `latest`/`next`/`main`) always redirects to its resolved exact location, and a
  // non-canonical query always redirects to canonicalize it — a single hop covers both at once (e.g.
  // `/ui/Action` -> `/ui@<latest>/Action.js`). An immutable ref (an exact semver, or an immutable
  // `main-<sha>`/`next-<sha>` channel — anything `isMutableVersion` rules out) is served directly:
  // its extensionless subpath (`Action`, `utils`) streams the resolved `.js`/`index.js` output as an
  // accepted alias of the canonical `.js` URL, without a redirect. This is safe because such a ref has
  // `requested === resolved.version`, so its bytes are immutable by construction (the store marks
  // `releases/*` and `channels/*` `immutable` and never overwrites them); a new version or ref publish
  // only ever mints new immutable paths and re-points the mutable tags, which still redirect. Serving
  // the extensionless alias directly also lets a cross-origin TypeScript language server read the
  // `X-TypeScript-Types` header off the response without following a 307 (modern-monaco's LSP stops at
  // redirects). `.js` (canonical) URLs are unchanged.
  if (isMutableVersion(route.requestedVersion, exact) || !query.canonical) {
    return redirectResponse(
      canonicalLocation(url, route.packageName, exact.version, assetPath, query.search),
    );
  }

  const object = await environment.ASSETS.get(`${exact.objectPrefix}/${assetPath}`);
  if (!object) {
    recorder.r2('asset', 'miss');
    return errorResponse(404);
  }
  recorder.r2('asset', 'hit');
  const etag = objectEtag(object);
  const link = preloadHeader(route.packageName, exact.version, query.components, metadata);
  const headers = responseHeaders({
    'Cache-Control': IMMUTABLE_CACHE_CONTROL,
    'Content-Type': contentType(assetPath),
  });
  if (etag) headers.set('ETag', etag);
  if (link) headers.set('Link', link);

  // When a served module has a sibling declaration in the release, advertise it with the same
  // `X-TypeScript-Types` header esm.sh uses, as a same-origin absolute URL, and expose the header to
  // cross-origin TypeScript language servers. Set before the 304 branch so a not-modified response
  // stays consistent with the full response, and it is preserved for HEAD.
  if (assetPath.endsWith('.js')) {
    const declarationPath = `${assetPath.slice(0, -'.js'.length)}.d.ts`;
    if (metadata.files.has(declarationPath)) {
      headers.set(
        'X-TypeScript-Types',
        `${url.origin}/${route.packageName}@${exact.version}/${declarationPath}`,
      );
      headers.set('Access-Control-Expose-Headers', 'X-TypeScript-Types');
    }
  }

  if (etagMatches(request.headers.get('If-None-Match'), etag)) {
    headers.delete('Content-Type');
    return new Response(null, { status: 304, headers });
  }
  return new Response(request.method === 'HEAD' ? null : object.body, { status: 200, headers });
}

function finalizeResponse(request: Request, response: Response): Response {
  if (request.method !== 'HEAD' || response.body === null) return response;
  return new Response(null, { status: response.status, headers: response.headers });
}

export async function fetch(request: Request, environment: WorkerEnvironment): Promise<Response> {
  const recorder = new ObservationRecorder();
  let response: Response;
  try {
    response = finalizeResponse(request, await handleRequest(request, environment, recorder));
  } catch (error) {
    const status = error instanceof RequestValidationError ? error.status : (502 as const);
    response = finalizeResponse(request, errorResponse(status));
  }
  emitObservation(environment, recorder, response.status);
  return response;
}

export default { fetch };
