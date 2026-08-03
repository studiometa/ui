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
  styles: Record<string, { path: string; autoInject: boolean }>;
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
  script?: 'alias' | 'exact' | 'none';
  workerSource?: 'blob:' | "'none'";
}

export interface CdnServers {
  artifactOrigin: string;
  build: BuildMetadata;
  exactUrl: (path: string, identifier?: string) => string;
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
  // The distribution is namespaced per package: releases/ui/<version>/ and
  // releases/js-toolkit/<version>/. The ui bundle imports js-toolkit through the absolute
  // /js-toolkit@<version>/ URL, so this server mirrors that namespace on a single origin — every
  // consumer resolves the one js-toolkit URL, exactly like the real Worker.
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
  const jsToolkitOutputDirectory = resolve(outputDirectory, 'releases/js-toolkit', jsToolkitVersion);
  const realUiDirectory = await realpath(uiOutputDirectory);
  const realJsToolkitDirectory = await realpath(jsToolkitOutputDirectory);
  const requests: RequestLog[] = [];
  const delays = new Map<string, number>();
  const encodedIdentifier = encodeURIComponent(build.build.identifier);
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

  const artifactServer = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', artifactOrigin);
    const entry = startLog(request, url.pathname, requests);
    finishLog(response, entry);

    if (url.pathname === '/alias/main/autoload.js') {
      response.statusCode = 307;
      response.setHeader('Location', `/cdn/${encodedIdentifier}/${build.entries.autoload.path}`);
      addArtifactHeaders(response, MIME_TYPES['.js']);
      response.end();
      return;
    }

    // The externalized, versioned js-toolkit artifact at its own absolute URL namespace.
    const toolkit = url.pathname.match(/^\/js-toolkit@([^/]+)\/(.+)$/);
    if (toolkit) {
      const version = decodeURIComponent(toolkit[1]);
      const relativePath = decodeURIComponent(toolkit[2]);
      const realPath =
        version === jsToolkitVersion
          ? await resolveWithin(jsToolkitOutputDirectory, realJsToolkitDirectory, relativePath)
          : undefined;
      if (!realPath) return notFound(response);
      await send(response, realPath, relativePath, await readFile(realPath));
      return;
    }

    const match = url.pathname.match(/^\/cdn\/([^/]+)\/(.+)$/);
    if (!match) return notFound(response);

    const identifier = decodeURIComponent(match[1]);
    const relativePath = decodeURIComponent(match[2]);
    const realPath = await resolveWithin(uiOutputDirectory, realUiDirectory, relativePath);
    if (!realPath) return notFound(response);

    let contents = await readFile(realPath);
    if (relativePath === build.entries.autoload.path && identifier !== build.build.identifier) {
      const source = contents.toString('utf8');
      const versionMarker = `version:"${build.package.version}"`;
      if (!source.includes(versionMarker)) {
        response.statusCode = 500;
        addArtifactHeaders(response, MIME_TYPES['.txt']);
        response.end('The versioned autoload fixture transform is stale.');
        return;
      }
      contents = Buffer.from(source.replace(versionMarker, `version:"${identifier}"`));
    }

    await send(response, realPath, relativePath, contents);
  });
  artifactOrigin = await listen(artifactServer);

  function exactUrl(path: string, identifier = build.build.identifier) {
    return `${artifactOrigin}/cdn/${encodeURIComponent(identifier)}/${path}`;
  }

  const pageServer = createServer((request, response) => {
    const url = new URL(request.url ?? '/', pageOrigin);
    if (url.pathname !== '/fixture') {
      response.statusCode = 404;
      response.end('Not found.');
      return;
    }

    const body = url.searchParams.get('body') ?? '';
    const script = url.searchParams.get('script') ?? 'exact';
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

    const scriptUrl =
      script === 'alias'
        ? `${artifactOrigin}/alias/main/autoload.js`
        : exactUrl(build.entries.autoload.path);
    const scriptMarkup =
      script === 'none'
        ? ''
        : `<script type="module" src="${escapeAttribute(scriptUrl)}" data-studiometa-ui></script>`;
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end(
      `<!doctype html><html><head><meta charset="utf-8"><title>CDN browser fixture</title></head><body>${body}${scriptMarkup}</body></html>`,
    );
  });
  pageOrigin = await listen(pageServer);

  const fixture: CdnServers = {
    artifactOrigin,
    build,
    exactUrl,
    fixtureUrl(options) {
      const url = new URL('/fixture', pageOrigin);
      url.searchParams.set('body', options.body);
      url.searchParams.set('script', options.script ?? 'exact');
      if (options.workerSource) {
        url.searchParams.set('workerSource', options.workerSource);
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
