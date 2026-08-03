import { parseArgs } from 'node:util';

interface SmokeConfig {
  baseUrl: string;
  timeout: number;
  browser: boolean;
}

interface CheckResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  detail?: string;
}

const USER_AGENT = 'studiometa-ui-cdn-smoke/1';

function packageEndpoint(
  config: SmokeConfig,
  packageName: string,
  version: string,
  asset: string,
  search = '',
): string {
  return `${config.baseUrl.replace(/\/$/, '')}/${packageName}@${version}/${asset}${search}`;
}

function endpoint(config: SmokeConfig, version: string, asset: string, search = ''): string {
  return packageEndpoint(config, 'ui', version, asset, search);
}

async function fetchWithTimeout(
  url: string,
  config: SmokeConfig,
  init: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeout);
  try {
    return await fetch(url, {
      ...init,
      headers: { 'User-Agent': USER_AGENT, ...init.headers },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function versionFromLocation(location: string | null): string {
  if (!location) throw new Error('The redirect is missing a Location header.');
  const path = new URL(location, 'https://cdn.invalid').pathname;
  const match = /^\/ui@([^/]+)\//.exec(path);
  if (!match) throw new Error(`The redirect target ${path} is not a canonical CDN location.`);
  return match[1];
}

async function resolveLatest(
  config: SmokeConfig,
): Promise<{ version: string; redirect: Response }> {
  const redirect = await fetchWithTimeout(endpoint(config, 'latest', 'autoload.js'), config, {
    redirect: 'manual',
  });
  if (redirect.status !== 307) {
    throw new Error(`Expected a 307 redirect from the latest alias, received ${redirect.status}.`);
  }
  return { version: versionFromLocation(redirect.headers.get('Location')), redirect };
}

interface BuildComponent {
  entry: string;
  dynamicImports: Array<{ entry: string }>;
}

interface BuildJson {
  components: Record<string, BuildComponent>;
  entries?: Record<string, { path: string; preload: string[] }>;
  dependencies?: Record<string, string>;
}

async function loadBuild(config: SmokeConfig, version: string): Promise<BuildJson> {
  const response = await fetchWithTimeout(endpoint(config, version, 'build.json'), config);
  if (!response.ok) throw new Error(`build.json returned HTTP ${response.status}.`);
  return (await response.json()) as BuildJson;
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function checkExactAutoload(config: SmokeConfig, version: string): Promise<void> {
  const response = await fetchWithTimeout(endpoint(config, version, 'autoload.js'), config, {
    headers: { Origin: 'https://example.com' },
  });
  assert(response.status === 200, `Exact autoload returned HTTP ${response.status}.`);
  assert(
    (response.headers.get('Content-Type') ?? '').includes('javascript'),
    `Exact autoload has a non-JavaScript content type: ${response.headers.get('Content-Type')}.`,
  );
  assert(
    (response.headers.get('Cache-Control') ?? '').includes('immutable'),
    'Exact autoload is not immutably cacheable.',
  );
  assert(
    response.headers.get('Access-Control-Allow-Origin') === '*',
    'Exact autoload is missing a permissive CORS header.',
  );
  assert(
    response.headers.get('Cross-Origin-Resource-Policy') === 'cross-origin',
    'Exact autoload is missing a cross-origin resource policy.',
  );
  await response.text();
}

async function checkEagerPreload(
  config: SmokeConfig,
  version: string,
  component: string,
): Promise<void> {
  const response = await fetchWithTimeout(
    endpoint(config, version, 'autoload.js', `?components=${component}`),
    config,
  );
  assert(response.status === 200, `Eager autoload returned HTTP ${response.status}.`);
  const link = response.headers.get('Link') ?? '';
  assert(link.includes('rel=modulepreload'), 'The eager response is missing modulepreload hints.');
  await response.text();
}

async function checkDynamicChunk(
  config: SmokeConfig,
  version: string,
  build: BuildJson,
): Promise<void> {
  const dynamicEntry = Object.values(build.components)
    .flatMap((component) => component.dynamicImports.map((dynamic) => dynamic.entry))
    .find(Boolean);
  if (!dynamicEntry) throw new Error('No dynamic import chunk is declared in build.json.');
  const response = await fetchWithTimeout(endpoint(config, version, dynamicEntry), config);
  assert(response.status === 200, `Dynamic chunk returned HTTP ${response.status}.`);
  assert(
    (response.headers.get('Content-Type') ?? '').includes('javascript'),
    'The dynamic chunk has a non-JavaScript content type.',
  );
  await response.text();
}

async function checkJsToolkitArtifact(
  config: SmokeConfig,
  jsToolkitVersion: string,
): Promise<void> {
  for (const asset of ['index.js', 'utils/index.js']) {
    const response = await fetchWithTimeout(
      packageEndpoint(config, 'js-toolkit', jsToolkitVersion, asset),
      config,
      { headers: { Origin: 'https://example.com' } },
    );
    assert(response.status === 200, `js-toolkit ${asset} returned HTTP ${response.status}.`);
    assert(
      (response.headers.get('Content-Type') ?? '').includes('javascript'),
      `js-toolkit ${asset} has a non-JavaScript content type: ${response.headers.get('Content-Type')}.`,
    );
    assert(
      (response.headers.get('Cache-Control') ?? '').includes('immutable'),
      `js-toolkit ${asset} is not immutably cacheable.`,
    );
    assert(
      response.headers.get('Access-Control-Allow-Origin') === '*',
      `js-toolkit ${asset} is missing a permissive CORS header.`,
    );
    assert(
      response.headers.get('Cross-Origin-Resource-Policy') === 'cross-origin',
      `js-toolkit ${asset} is missing a cross-origin resource policy.`,
    );
    await response.text();
  }

  // js-toolkit is exact-version only: aliases and the versionless default must not resolve.
  for (const requested of [`${jsToolkitVersion.split('.')[0]}`, 'latest']) {
    const aliased = await fetchWithTimeout(
      packageEndpoint(config, 'js-toolkit', requested, 'index.js'),
      config,
      { redirect: 'manual' },
    );
    assert(
      aliased.status === 404,
      `js-toolkit alias ${requested} should be 404 but returned HTTP ${aliased.status}.`,
    );
  }
}

async function checkSharedToolkitUrl(
  config: SmokeConfig,
  version: string,
  jsToolkitVersion: string,
  build: BuildJson,
): Promise<void> {
  const expectedUrl = `/js-toolkit@${jsToolkitVersion}/index.js`;
  // The single external js-toolkit URL is imported from the entry's static graph — usually a shared
  // chunk rather than the entry file itself. Scan the ui barrel's entry plus its preload graph (and
  // fall back to autoload.js) and confirm at least one served ui module references the shared URL.
  const indexEntry = build.entries?.index;
  const graph = indexEntry ? [indexEntry.path, ...indexEntry.preload] : ['autoload.js'];
  for (const asset of graph) {
    const response = await fetchWithTimeout(endpoint(config, version, asset), config);
    assert(response.status === 200, `ui ${asset} returned HTTP ${response.status}.`);
    if ((await response.text()).includes(expectedUrl)) return;
  }
  throw new Error(`No served ui module references the shared js-toolkit URL ${expectedUrl}.`);
}

async function checkSourceMap(config: SmokeConfig, version: string): Promise<void> {
  const response = await fetchWithTimeout(endpoint(config, version, 'autoload.js'), config);
  const body = await response.text();
  const match = /\/\/# sourceMappingURL=(\S+)/.exec(body);
  if (!match) throw new Error('autoload.js does not reference a source map.');
  const map = await fetchWithTimeout(endpoint(config, version, match[1]), config);
  assert(map.status === 200, `The source map returned HTTP ${map.status}.`);
  const parsed = (await map.json()) as { version?: number };
  assert(parsed.version === 3, `Unexpected source map version: ${parsed.version}.`);
}

async function checkNextAlias(config: SmokeConfig): Promise<CheckResult> {
  const name = 'Next alias redirect';
  try {
    const response = await fetchWithTimeout(endpoint(config, 'next', 'autoload.js'), config, {
      redirect: 'manual',
    });
    // The `next` channel only exists once a main channel has been published. A stable-only
    // deployment legitimately has no `next` alias, so treat a 404 as skipped, not failed.
    if (response.status === 404) {
      return { name, status: 'skipped', detail: 'No main channel is published.' };
    }
    if (response.status !== 307) {
      return { name, status: 'failed', detail: `The next alias returned HTTP ${response.status}.` };
    }
    versionFromLocation(response.headers.get('Location'));
    return { name, status: 'passed' };
  } catch (error) {
    return {
      name,
      status: 'failed',
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkBrowserExecution(config: SmokeConfig, version: string): Promise<CheckResult> {
  let chromium: typeof import('@playwright/test').chromium;
  try {
    ({ chromium } = await import('@playwright/test'));
  } catch {
    return { name: 'Browser execution', status: 'skipped', detail: 'Playwright is not installed.' };
  }
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const moduleUrl = endpoint(config, version, 'autoload.js');
    const evaluated = await page.evaluate(async (url) => {
      await import(url);
      return typeof window.document !== 'undefined';
    }, moduleUrl);
    assert(evaluated, 'The autoload module did not evaluate in the browser.');
    return { name: 'Browser execution', status: 'passed' };
  } finally {
    await browser.close();
  }
}

async function run(check: () => Promise<void>, name: string): Promise<CheckResult> {
  try {
    await check();
    return { name, status: 'passed' };
  } catch (error) {
    return {
      name,
      status: 'failed',
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'base-url': { type: 'string' },
      timeout: { type: 'string' },
      browser: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: false,
  });

  if (values.help) {
    process.stdout.write(
      'Usage: node scripts/smoke.ts --base-url <url> [--timeout <ms>] [--browser]\n' +
        'Runs public CDN synthetic checks against a base URL. No credentials are required.\n' +
        'The base URL defaults to CDN_BASE_URL.\n',
    );
    return;
  }

  const baseUrl = values['base-url'] ?? process.env.CDN_BASE_URL;
  if (!baseUrl) throw new Error('A base URL is required (pass --base-url or set CDN_BASE_URL).');
  const config: SmokeConfig = {
    baseUrl,
    timeout: values.timeout ? Number(values.timeout) : 30_000,
    browser: Boolean(values.browser),
  };

  process.stdout.write(`Running CDN smoke checks against ${config.baseUrl}.\n`);
  const { version } = await resolveLatest(config);
  const build = await loadBuild(config, version);
  const eagerComponent = Object.keys(build.components).sort()[0];
  const jsToolkitVersion = build.dependencies?.['@studiometa/js-toolkit'];

  const results: CheckResult[] = [];
  results.push({ name: 'Latest alias redirect', status: 'passed' });
  results.push(await run(() => checkExactAutoload(config, version), 'Exact autoload'));
  results.push(await checkNextAlias(config));
  if (eagerComponent) {
    results.push(
      await run(() => checkEagerPreload(config, version, eagerComponent), 'Eager preload'),
    );
  }
  results.push(await run(() => checkDynamicChunk(config, version, build), 'Dynamic chunk'));
  results.push(await run(() => checkSourceMap(config, version), 'Source map'));
  if (jsToolkitVersion) {
    results.push(
      await run(() => checkJsToolkitArtifact(config, jsToolkitVersion), 'js-toolkit artifact'),
    );
    results.push(
      await run(
        () => checkSharedToolkitUrl(config, version, jsToolkitVersion, build),
        'Shared js-toolkit URL',
      ),
    );
  } else {
    results.push({
      name: 'js-toolkit artifact',
      status: 'failed',
      detail: 'The ui build.json does not record its @studiometa/js-toolkit dependency version.',
    });
  }
  if (config.browser) {
    results.push(await checkBrowserExecution(config, version));
  }

  for (const result of results) {
    const glyph = result.status === 'passed' ? 'ok' : result.status === 'skipped' ? '--' : 'XX';
    process.stdout.write(`[${glyph}] ${result.name}${result.detail ? `: ${result.detail}` : ''}\n`);
  }

  const failed = results.filter((result) => result.status === 'failed');
  process.stdout.write(
    `\n${results.filter((r) => r.status === 'passed').length} passed, ${failed.length} failed, ` +
      `${results.filter((r) => r.status === 'skipped').length} skipped.\n`,
  );
  if (failed.length > 0) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    process.stderr.write(`Smoke run failed: ${error instanceof Error ? error.message : error}\n`);
    process.exit(1);
  });
}
