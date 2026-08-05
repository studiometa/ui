import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base, expect, type Page } from '@playwright/test';

const packageDirectory = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const outputDirectory = resolve(packageDirectory, 'dist');

interface BuildMetadata {
  package: { version: string };
  dependencies: Record<string, string>;
  build: { identifier: string };
  entries: Record<string, { path: string; sourceMap: string; preload: string[] }>;
  components: Record<
    string,
    {
      entry: string;
      preload: string[];
      dynamicImports: Array<{ entry: string; preload: string[] }>;
    }
  >;
}

export interface RequestLog {
  method: string;
  pathname: string;
  status: number;
  requestedAt: number;
  completedAt?: number;
  durationMs?: number;
}

interface FixturePageOptions {
  body: string;
  // Tokens declared eager through `<meta name="studiometa-ui:eager" content="A, B">`. This is the
  // ui-autoload replacement for the retired eager-components query: listed tokens mount eagerly
  // regardless of their manifest strategy. Omitted or empty → no meta element is emitted.
  eager?: string[];
  // When true, the page also loads the `ui-mapbox.js` side-effect entry so Mapbox components
  // autoload. `ui.js` is always loaded (unless `bootstrap` is disabled).
  mapbox?: boolean;
  // When false, no ui-autoload side-effect entry is injected at all — used by the source-map test,
  // which only needs the trees reachable, not bootstrapped.
  bootstrap?: boolean;
  workerSource?: 'blob:' | "'none'";
  // When set, the fixture page declares an import map so the externalized Mapbox specifiers resolve
  // to the stub modules this server hosts (mirroring a consumer that points "mapbox-gl" at their
  // own build). Maps each bare specifier to the artifact-origin stub path.
  mapboxImportMap?: boolean;
}

// A minimal stand-in for the external `mapbox-gl` module the CDN no longer bundles. It exposes just
// enough for the Mapbox components to resolve and mount without a Mapbox token or network access.
const MAPBOX_GL_STUB = `
class StubMap {
  constructor() { this.__handlers = {}; }
  on(type, callback) {
    (this.__handlers[type] ||= []).push(callback);
    if (type === 'load') setTimeout(() => callback({ target: this }), 0);
    return this;
  }
  off() { return this; }
  remove() {}
  setStyle() {}
  addControl() {}
  removeControl() {}
}
const noop = class {};
export default {
  Map: StubMap,
  Marker: noop,
  Popup: noop,
  LngLat: noop,
  NavigationControl: noop,
  GeolocateControl: noop,
  FullscreenControl: noop,
};
`;
const MAPBOX_GEOCODER_STUB =
  'export default class StubGeocoder { addTo() {} onRemove() {} on() {} };';
const MAPBOX_GL_STUB_PATH = '/stub/mapbox-gl.js';
const MAPBOX_GEOCODER_STUB_PATH = '/stub/mapbox-gl-geocoder.js';

export interface CdnServers {
  artifactOrigin: string;
  // The `@studiometa/ui` component tree, served under `/ui@<version>/…`.
  build: BuildMetadata;
  // The lockstep `@studiometa/ui-mapbox` tree, served under `/ui-mapbox@<version>/…`.
  uiMapboxBuild: BuildMetadata;
  // The lockstep `@studiometa/ui-autoload` tree (the autoloader engine and side-effect entries),
  // served under `/ui-autoload@<version>/…`.
  uiAutoloadBuild: BuildMetadata;
  uiUrl: (path: string) => string;
  uiMapboxUrl: (path: string) => string;
  uiAutoloadUrl: (path: string) => string;
  fixtureUrl: (options: FixturePageOptions) => string;
  requests: RequestLog[];
  reset: () => void;
  setDelay: (path: string, milliseconds: number) => void;
}

interface BrowserDiagnostics {
  consoleErrors: string[];
  pageErrors: string[];
  requestFailures: string[];
}

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function listen(server: Server): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('The local test server did not bind a TCP port.'));
        return;
      }
      resolvePromise(`http://127.0.0.1:${address.port}`);
    });
  });
}

function close(server: Server): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    server.close((error) => (error ? reject(error) : resolvePromise()));
  });
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

function escapeAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}

function addArtifactHeaders(response: ServerResponse, contentType: string): void {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  response.setHeader('Timing-Allow-Origin', '*');
  response.setHeader('Content-Type', contentType);
}

function startLog(request: IncomingMessage, pathname: string, requests: RequestLog[]): RequestLog {
  const entry: RequestLog = {
    method: request.method ?? 'GET',
    pathname,
    status: 0,
    requestedAt: Date.now(),
  };
  requests.push(entry);
  return entry;
}

function finishLog(response: ServerResponse, entry: RequestLog): void {
  response.once('finish', () => {
    entry.status = response.statusCode;
    entry.completedAt = Date.now();
    entry.durationMs = entry.completedAt - entry.requestedAt;
  });
}

async function resolveWithin(
  baseDirectory: string,
  realBaseDirectory: string,
  relativePath: string,
): Promise<string | undefined> {
  const realPath = await realpath(resolve(baseDirectory, relativePath)).catch(() => undefined);
  if (
    !realPath ||
    (!realPath.startsWith(`${realBaseDirectory}${sep}`) && realPath !== realBaseDirectory)
  ) {
    return undefined;
  }
  return realPath;
}

async function createServers(): Promise<{ fixture: CdnServers; close: () => Promise<void> }> {
  // The distribution is namespaced per package and served on one origin, mirroring the real Worker:
  // the ui tree at releases/ui/<version>/, its lockstep siblings ui-mapbox and ui-autoload at
  // releases/ui-mapbox/<version>/ and releases/ui-autoload/<version>/, and js-toolkit at
  // releases/js-toolkit/<version>/. Every cross-tree import the bundles bake is origin-relative
  // (`/ui@<v>/manifest.js`, `/js-toolkit@<v>/index.js`, …), so hosting each tree at its real
  // deployment URL on a single origin lets those baked URLs resolve exactly as in production.
  const uiVersion = (
    JSON.parse(await readFile(resolve(packageDirectory, 'package.json'), 'utf8')) as {
      version: string;
    }
  ).version;
  const uiOutputDirectory = resolve(outputDirectory, 'releases/ui', uiVersion);
  const build = JSON.parse(
    await readFile(resolve(uiOutputDirectory, 'build.json'), 'utf8'),
  ) as BuildMetadata;
  const jsToolkitVersion = build.dependencies['@studiometa/js-toolkit'];
  const jsToolkitOutputDirectory = resolve(
    outputDirectory,
    'releases/js-toolkit',
    jsToolkitVersion,
  );
  // ui-mapbox is versioned in lockstep with ui and served from its own absolute /ui-mapbox@<v>/ URL.
  const uiMapboxOutputDirectory = resolve(outputDirectory, 'releases/ui-mapbox', uiVersion);
  const uiMapboxBuild = JSON.parse(
    await readFile(resolve(uiMapboxOutputDirectory, 'build.json'), 'utf8'),
  ) as BuildMetadata;
  // ui-autoload is likewise versioned in lockstep with ui and served from /ui-autoload@<v>/. Its
  // `ui.js` / `ui-mapbox.js` side-effect entries bake the origin-relative `/ui@<v>/manifest.js` and
  // `/ui-mapbox@<v>/manifest.js` URLs and drive the autoloader on import.
  const uiAutoloadOutputDirectory = resolve(outputDirectory, 'releases/ui-autoload', uiVersion);
  const uiAutoloadBuild = JSON.parse(
    await readFile(resolve(uiAutoloadOutputDirectory, 'build.json'), 'utf8'),
  ) as BuildMetadata;
  const realUiDirectory = await realpath(uiOutputDirectory);
  const realJsToolkitDirectory = await realpath(jsToolkitOutputDirectory);
  const realUiMapboxDirectory = await realpath(uiMapboxOutputDirectory);
  const realUiAutoloadDirectory = await realpath(uiAutoloadOutputDirectory);
  const requests: RequestLog[] = [];
  const delays = new Map<string, number>();
  let artifactOrigin = '';
  let pageOrigin = '';

  const notFound = (response: ServerResponse): void => {
    response.statusCode = 404;
    addArtifactHeaders(response, MIME_TYPES['.txt']);
    response.end('Not found.');
  };
  const send = async (
    response: ServerResponse,
    realPath: string,
    relativePath: string,
    contents: Buffer,
  ): Promise<void> => {
    const responseDelay = delays.get(relativePath) ?? 0;
    if (responseDelay > 0) await delay(responseDelay);
    response.statusCode = 200;
    addArtifactHeaders(response, MIME_TYPES[extname(realPath)] ?? 'application/octet-stream');
    response.setHeader('Server-Timing', `fixture;dur=${responseDelay}`);
    response.end(contents);
  };

  // Each versioned tree is served from its own real directory. The requested version must match the
  // tree's version (ui, ui-mapbox and ui-autoload all move in lockstep with `uiVersion`); anything
  // else is a 404, exactly like the real Worker rejecting an unknown release.
  const serveTree = async (
    response: ServerResponse,
    version: string,
    expectedVersion: string,
    baseDirectory: string,
    realBaseDirectory: string,
    relativePath: string,
  ): Promise<void> => {
    const realPath =
      version === expectedVersion
        ? await resolveWithin(baseDirectory, realBaseDirectory, relativePath)
        : undefined;
    if (!realPath) return notFound(response);
    await send(response, realPath, relativePath, await readFile(realPath));
  };

  const artifactServer = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', artifactOrigin);
    const entry = startLog(request, url.pathname, requests);
    finishLog(response, entry);

    if (url.pathname === MAPBOX_GL_STUB_PATH || url.pathname === MAPBOX_GEOCODER_STUB_PATH) {
      addArtifactHeaders(response, MIME_TYPES['.js']);
      response.statusCode = 200;
      response.end(url.pathname === MAPBOX_GL_STUB_PATH ? MAPBOX_GL_STUB : MAPBOX_GEOCODER_STUB);
      return;
    }

    // The externalized, versioned js-toolkit artifact at its own absolute URL namespace — the one
    // shared instance every tree imports.
    const toolkit = url.pathname.match(/^\/js-toolkit@([^/]+)\/(.+)$/);
    if (toolkit) {
      await serveTree(
        response,
        decodeURIComponent(toolkit[1]),
        jsToolkitVersion,
        jsToolkitOutputDirectory,
        realJsToolkitDirectory,
        decodeURIComponent(toolkit[2]),
      );
      return;
    }

    // The ui component tree. The ui-autoload `ui.js` entry bakes `/ui@<v>/manifest.js`, whose lazy
    // loaders resolve sibling `/ui@<v>/<Component>.js` chunks from here.
    const ui = url.pathname.match(/^\/ui@([^/]+)\/(.+)$/);
    if (ui) {
      await serveTree(
        response,
        decodeURIComponent(ui[1]),
        uiVersion,
        uiOutputDirectory,
        realUiDirectory,
        decodeURIComponent(ui[2]),
      );
      return;
    }

    // The lockstep ui-mapbox tree. The ui-autoload `ui-mapbox.js` entry bakes
    // `/ui-mapbox@<v>/manifest.js`, whose lazy loaders resolve Mapbox component chunks from here.
    const uiMapbox = url.pathname.match(/^\/ui-mapbox@([^/]+)\/(.+)$/);
    if (uiMapbox) {
      await serveTree(
        response,
        decodeURIComponent(uiMapbox[1]),
        uiVersion,
        uiMapboxOutputDirectory,
        realUiMapboxDirectory,
        decodeURIComponent(uiMapbox[2]),
      );
      return;
    }

    // The ui-autoload tree — the generic autoloader engine plus the `index.js`, `ui.js` and
    // `ui-mapbox.js` entries the fixture page bootstraps from.
    const uiAutoload = url.pathname.match(/^\/ui-autoload@([^/]+)\/(.+)$/);
    if (uiAutoload) {
      await serveTree(
        response,
        decodeURIComponent(uiAutoload[1]),
        uiVersion,
        uiAutoloadOutputDirectory,
        realUiAutoloadDirectory,
        decodeURIComponent(uiAutoload[2]),
      );
      return;
    }

    notFound(response);
  });
  artifactOrigin = await listen(artifactServer);

  function uiUrl(path: string) {
    return `${artifactOrigin}/ui@${encodeURIComponent(uiVersion)}/${path}`;
  }

  function uiMapboxUrl(path: string) {
    return `${artifactOrigin}/ui-mapbox@${encodeURIComponent(uiVersion)}/${path}`;
  }

  function uiAutoloadUrl(path: string) {
    return `${artifactOrigin}/ui-autoload@${encodeURIComponent(uiVersion)}/${path}`;
  }

  const pageServer = createServer((request, response) => {
    const url = new URL(request.url ?? '/', pageOrigin);
    if (url.pathname !== '/fixture') {
      response.statusCode = 404;
      response.end('Not found.');
      return;
    }

    const body = url.searchParams.get('body') ?? '';
    const workerSource = url.searchParams.get('workerSource');
    if (workerSource) {
      response.setHeader(
        'Content-Security-Policy',
        [
          "default-src 'none'",
          `script-src 'self' ${artifactOrigin}`,
          `connect-src 'self' ${artifactOrigin} blob:`,
          `style-src 'self' ${artifactOrigin} 'unsafe-inline'`,
          'img-src data: blob:',
          'font-src data:',
          `worker-src ${workerSource}`,
        ].join('; '),
      );
    }

    // The import map must precede any module script so the externalized Mapbox specifiers resolve.
    const importMapMarkup =
      url.searchParams.get('mapboxImportMap') === '1'
        ? `<script type="importmap">${JSON.stringify({
            imports: {
              'mapbox-gl': `${artifactOrigin}${MAPBOX_GL_STUB_PATH}`,
              '@mapbox/mapbox-gl-geocoder': `${artifactOrigin}${MAPBOX_GEOCODER_STUB_PATH}`,
            },
          })}</script>`
        : '';

    // Eager tokens are declared through a `<meta>` element in the head — the ui-autoload replacement
    // for the retired eager-components query. It must be present before the side-effect entries run.
    const eagerTokens = url.searchParams.get('eager') ?? '';
    const eagerMarkup = eagerTokens
      ? `<meta name="studiometa-ui:eager" content="${escapeAttribute(eagerTokens)}">`
      : '';

    // Bootstrapping the page is a side effect of importing the ui-autoload entries: `ui.js` registers
    // the ui manifest and starts the autoloader, and `ui-mapbox.js` adds the Mapbox manifest to the
    // same coalesced start. There is no marked script and no runtime query — `import` is the contract.
    const bootstrap = url.searchParams.get('bootstrap') !== '0';
    const withMapbox = url.searchParams.get('mapbox') === '1';
    const bootstrapScripts = bootstrap
      ? [
          `<script type="module" src="${escapeAttribute(uiAutoloadUrl(uiAutoloadBuild.entries.ui.path))}"></script>`,
          withMapbox
            ? `<script type="module" src="${escapeAttribute(uiAutoloadUrl(uiAutoloadBuild.entries['ui-mapbox'].path))}"></script>`
            : '',
        ].join('')
      : '';

    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end(
      `<!doctype html><html><head><meta charset="utf-8"><title>CDN browser fixture</title>${eagerMarkup}${importMapMarkup}</head><body>${body}${bootstrapScripts}</body></html>`,
    );
  });
  pageOrigin = await listen(pageServer);

  const fixture: CdnServers = {
    artifactOrigin,
    build,
    uiMapboxBuild,
    uiAutoloadBuild,
    uiUrl,
    uiMapboxUrl,
    uiAutoloadUrl,
    fixtureUrl(options) {
      const url = new URL('/fixture', pageOrigin);
      url.searchParams.set('body', options.body);
      if (options.eager && options.eager.length > 0) {
        url.searchParams.set('eager', options.eager.join(', '));
      }
      if (options.mapbox) {
        url.searchParams.set('mapbox', '1');
      }
      if (options.bootstrap === false) {
        url.searchParams.set('bootstrap', '0');
      }
      if (options.workerSource) {
        url.searchParams.set('workerSource', options.workerSource);
      }
      if (options.mapboxImportMap) {
        url.searchParams.set('mapboxImportMap', '1');
      }
      return url.href;
    },
    requests,
    reset() {
      requests.length = 0;
      delays.clear();
    },
    setDelay(path, milliseconds) {
      delays.set(path, milliseconds);
    },
  };

  return {
    fixture,
    close: async () => {
      await Promise.all([close(pageServer), close(artifactServer)]);
    },
  };
}

export const test = base.extend<{}, { cdn: CdnServers }>({
  cdn: [
    async ({ browserName: _browserName }, use) => {
      const servers = await createServers();
      await use(servers.fixture);
      await servers.close();
    },
    { scope: 'worker' },
  ],
});

export function captureDiagnostics(page: Page): BrowserDiagnostics {
  const diagnostics: BrowserDiagnostics = {
    consoleErrors: [],
    pageErrors: [],
    requestFailures: [],
  };
  page.on('console', (message) => {
    if (message.type() === 'error') diagnostics.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    diagnostics.requestFailures.push(
      `${request.url()}: ${request.failure()?.errorText ?? 'unknown'}`,
    );
  });
  return diagnostics;
}

export function expectNoBrowserErrors(diagnostics: BrowserDiagnostics): void {
  expect(diagnostics.consoleErrors).toEqual([]);
  expect(diagnostics.pageErrors).toEqual([]);
  expect(diagnostics.requestFailures).toEqual([]);
}

export async function expectMounted(page: Page, selector: string, token: string): Promise<void> {
  await expect
    .poll(() =>
      page.locator(selector).evaluate((element, componentToken) => {
        const instance = (element as Element & { __base__?: Map<string, unknown> }).__base__?.get(
          componentToken,
        ) as { $isMounted?: boolean } | 'terminated' | undefined;
        return instance !== 'terminated' && instance?.$isMounted === true;
      }, token),
    )
    .toBe(true);
}
