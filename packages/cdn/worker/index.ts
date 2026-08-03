import { canonicalizeQuery, parseRoute, RequestValidationError } from './queries.ts';
import {
  contentType,
  errorResponse,
  etagMatches,
  IMMUTABLE_CACHE_CONTROL,
  optionsResponse,
  redirectResponse,
  responseHeaders,
} from './responses.ts';
import type {
  BuildComponent,
  BuildMetadata,
  ExactVersion,
  IntegrityMetadata,
  R2BucketLike,
  R2ObjectBodyLike,
  WorkerEnvironment,
} from './types.ts';
import { isMutableVersion, parseVersionsIndex, resolveVersion } from './versions.ts';

const MAX_LINK_HEADER_BYTES = 7_500;
const PUBLIC_PACKAGE_NAME = '@studiometa/ui-cdn';
const SAFE_METADATA_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.?(?:\/|$))(?!.*\\)[0-9A-Za-z._@+/-]+$/;

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
    buildValue.package.name !== PUBLIC_PACKAGE_NAME ||
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
        typeof component.strategy !== 'string',
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
): Promise<ReleaseMetadata | undefined> {
  const [build, integrity] = await Promise.all([
    readJsonObject(bucket, `${exact.objectPrefix}/build.json`),
    readJsonObject(bucket, `${exact.objectPrefix}/integrity.json`),
  ]);
  if (build === undefined || integrity === undefined) return undefined;
  return parseReleaseMetadata(build, integrity, exact);
}

function canonicalLocation(
  url: URL,
  exactVersion: string,
  assetPath: string,
  search: string,
): string {
  return `${url.origin}/ui@${exactVersion}/${assetPath}${search}`;
}

function preloadHeader(
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
    const link = `</ui@${exactVersion}/${path}>; rel=modulepreload`;
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

async function handleRequest(request: Request, environment: WorkerEnvironment): Promise<Response> {
  if (request.method === 'OPTIONS') return optionsResponse();
  if (request.method !== 'GET' && request.method !== 'HEAD') return errorResponse(405);

  const url = new URL(request.url);
  const route = parseRoute(url.pathname);
  const indexValue = await readJsonObject(environment.ASSETS, 'versions.json');
  if (indexValue === undefined) return errorResponse(502);
  const versions = parseVersionsIndex(indexValue);
  const exact = resolveVersion(versions, route.requestedVersion);
  if (!exact) return errorResponse(404);

  const metadata = await loadRelease(environment.ASSETS, exact);
  if (!metadata || !metadata.files.has(route.assetPath)) return errorResponse(404);

  const query = canonicalizeQuery(
    url,
    route.assetPath,
    new Set(Object.keys(metadata.build.components)),
  );
  if (isMutableVersion(route.requestedVersion, exact) || !query.canonical) {
    return redirectResponse(canonicalLocation(url, exact.version, route.assetPath, query.search));
  }

  const object = await environment.ASSETS.get(`${exact.objectPrefix}/${route.assetPath}`);
  if (!object) return errorResponse(404);
  const etag = objectEtag(object);
  const link = preloadHeader(exact.version, query.components, metadata);
  const headers = responseHeaders({
    'Cache-Control': IMMUTABLE_CACHE_CONTROL,
    'Content-Type': contentType(route.assetPath),
  });
  if (etag) headers.set('ETag', etag);
  if (link) headers.set('Link', link);

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
  try {
    return finalizeResponse(request, await handleRequest(request, environment));
  } catch (error) {
    const response =
      error instanceof RequestValidationError ? errorResponse(error.status) : errorResponse(502);
    return finalizeResponse(request, response);
  }
}

export default { fetch };
