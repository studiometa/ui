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
  const redirect = await fetchWithTimeout(endpoint(config, 'latest', 'index.js'), config, {
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

async function checkUiAutoloadArtifact(config: SmokeConfig, version: string): Promise<void> {
  // The ui-autoload tree is versioned in lockstep with ui, so it resolves at the same version. Its
  // pure `index.js` barrel and the two side-effect entries (`ui.js`, `ui-mapbox.js`) must each serve
  // as an immutable, permissively-CORS'd JavaScript module.
  for (const asset of ['index.js', 'ui.js', 'ui-mapbox.js']) {
    const response = await fetchWithTimeout(
      packageEndpoint(config, 'ui-autoload', version, asset),
      config,
      { headers: { Origin: 'https://example.com' } },
    );
    assert(response.status === 200, `ui-autoload ${asset} returned HTTP ${response.status}.`);
    assert(
      (response.headers.get('Content-Type') ?? '').includes('javascript'),
      `ui-autoload ${asset} has a non-JavaScript content type: ${response.headers.get('Content-Type')}.`,
    );
    assert(
      (response.headers.get('Cache-Control') ?? '').includes('immutable'),
      `ui-autoload ${asset} is not immutably cacheable.`,
    );
    assert(
      response.headers.get('Access-Control-Allow-Origin') === '*',
      `ui-autoload ${asset} is missing a permissive CORS header.`,
    );
    assert(
      response.headers.get('Cross-Origin-Resource-Policy') === 'cross-origin',
      `ui-autoload ${asset} is missing a cross-origin resource policy.`,
    );
    const body = await response.text();
    // The `ui.js` side-effect entry reuses the ui tree's manifest cross-tree rather than bundling it,
    // so its baked origin-relative URL must reference `/ui@<version>/manifest.js`.
    if (asset === 'ui.js') {
      assert(
        body.includes(`/ui@${version}/manifest.js`),
        'ui-autoload ui.js does not reference the baked cross-tree /ui@<version>/manifest.js URL.',
      );
      // The bootstrap-only modulepreload header must warm the always-needed dependencies — the shared
      // autoload runtime chunk and the cross-tree ui manifest — while NEVER preloading a component
      // chunk (components stay lazy). This locks the header's safety property against the live edge.
      const link = response.headers.get('Link') ?? '';
      assert(
        link.includes('rel=modulepreload'),
        'ui-autoload ui.js is missing a modulepreload Link header.',
      );
      assert(
        link.includes(`/ui@${version}/manifest.js`),
        'ui-autoload ui.js Link header omits the cross-tree /ui@<version>/manifest.js URL.',
      );
      assert(
        new RegExp(`/ui-autoload@${version}/chunks/runtime-[^,>]+\\.js`).test(link),
        'ui-autoload ui.js Link header omits the autoload runtime chunk.',
      );
      for (const token of ['Accordion', 'Action', 'MapboxMap']) {
        assert(
          !link.includes(`/${token}.js`),
          `ui-autoload ui.js Link header unexpectedly preloads a component chunk (${token}.js).`,
        );
      }
    }
    if (asset === 'ui-mapbox.js') {
      assert(
        body.includes(`/ui-mapbox@${version}/manifest.js`),
        'ui-autoload ui-mapbox.js does not reference the baked cross-tree /ui-mapbox@<version>/manifest.js URL.',
      );
    }
  }

  // Serving the side-effect entries is not enough: each `import { manifest } from '…/manifest.js'`
  // binding must actually resolve. A broken cross-tree link (the manifest module serving but NOT
  // exporting `manifest`, or 404'ing outright) would leave the ui-autoload runtime importing
  // `undefined` — the exact class of bug this check exists to catch. Assert both per-package manifest
  // modules serve AND expose a `manifest` export binding.
  for (const tree of ['ui', 'ui-mapbox'] as const) {
    const manifestUrl = packageEndpoint(config, tree, version, 'manifest.js');
    const response = await fetchWithTimeout(manifestUrl, config, {
      headers: { Origin: 'https://example.com' },
    });
    assert(
      response.status === 200,
      `${tree} manifest.js returned HTTP ${response.status} (the ui-autoload ${tree}.js entry imports it).`,
    );
    assert(
      (response.headers.get('Content-Type') ?? '').includes('javascript'),
      `${tree} manifest.js has a non-JavaScript content type: ${response.headers.get('Content-Type')}.`,
    );
    const body = await response.text();
    // The facade re-exports its package manifest, so the emitted module surfaces `manifest` as a bare
    // `export const manifest`, a re-export (`export { … as manifest }` / `export{manifest}`), or a
    // `manifest as` alias in an aggregated export list. Any of these proves the binding exists.
    assert(
      /(?:export\s*(?:const|let|var|function|class)\s+manifest\b|(?:^|[\s{,])manifest\s+as\b|\bas\s+manifest\b|[{,]\s*manifest\s*[},])/.test(
        body,
      ),
      `${tree} manifest.js does not export a \`manifest\` binding; the ui-autoload ${tree}.js cross-tree import would resolve to undefined.`,
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
  // fall back to index.js) and confirm at least one served ui module references the shared URL.
  const indexEntry = build.entries?.index;
  const graph = indexEntry ? [indexEntry.path, ...indexEntry.preload] : ['index.js'];
  for (const asset of graph) {
    const response = await fetchWithTimeout(endpoint(config, version, asset), config);
    assert(response.status === 200, `ui ${asset} returned HTTP ${response.status}.`);
    if ((await response.text()).includes(expectedUrl)) return;
  }
  throw new Error(`No served ui module references the shared js-toolkit URL ${expectedUrl}.`);
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
    // Evaluate BOTH ui-autoload side-effect entries (`ui.js`, `ui-mapbox.js`), each of which
    // statically imports its package's baked cross-tree `/…@<v>/manifest.js` — so a broken binding
    // or a 404 manifest rejects the dynamic import here.
    const moduleUrls = [
      packageEndpoint(config, 'ui-autoload', version, 'ui.js'),
      packageEndpoint(config, 'ui-autoload', version, 'ui-mapbox.js'),
    ];
    // Independently import each per-package manifest module and confirm its `manifest` export links to
    // a non-empty object — catching a manifest that serves but omits the `manifest` binding.
    const manifestUrls = [
      packageEndpoint(config, 'ui', version, 'manifest.js'),
      packageEndpoint(config, 'ui-mapbox', version, 'manifest.js'),
    ];
    const evaluated = await page.evaluate(
      async ({ modules, manifests }) => {
        for (const url of modules) await import(url);
        for (const url of manifests) {
          const mod = (await import(url)) as { manifest?: unknown };
          const manifest = mod.manifest;
          if (
            !manifest ||
            typeof manifest !== 'object' ||
            Object.keys(manifest as object).length === 0
          ) {
            throw new Error(`Manifest module ${url} does not export a non-empty \`manifest\` object.`);
          }
        }
        return typeof window.document !== 'undefined';
      },
      { modules: moduleUrls, manifests: manifestUrls },
    );
    assert(evaluated, 'The autoload modules did not evaluate in the browser.');
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
  const jsToolkitVersion = build.dependencies?.['@studiometa/js-toolkit'];

  const results: CheckResult[] = [];
  results.push({ name: 'Latest alias redirect', status: 'passed' });
  results.push(await run(() => checkDynamicChunk(config, version, build), 'Dynamic chunk'));
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
  results.push(
    await run(() => checkUiAutoloadArtifact(config, version), 'ui-autoload artifact'),
  );
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
