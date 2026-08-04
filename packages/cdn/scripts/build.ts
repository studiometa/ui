import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild, { type Metafile, type Plugin } from 'esbuild';
import { componentCatalogs } from '../src/component-metadata.ts';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const packageDirectory = resolve(scriptsDirectory, '..');
const repositoryDirectory = resolve(packageDirectory, '../..');
const defaultOutputDirectory = resolve(packageDirectory, 'dist');
const packageMetadata = JSON.parse(
  await readFile(resolve(packageDirectory, 'package.json'), 'utf8'),
);
const jsToolkitMetadata = JSON.parse(
  await readFile(
    resolve(repositoryDirectory, 'node_modules/@studiometa/js-toolkit/package.json'),
    'utf8',
  ),
);
const sizeBudgets = JSON.parse(
  await readFile(resolve(packageDirectory, 'size-budgets.json'), 'utf8'),
) as SizeBudgets;

const uiVersion: string = packageMetadata.version;
const jsToolkitVersion: string = jsToolkitMetadata.version;
const JS_TOOLKIT_BUILD_NAME = '@studiometa/ui-cdn-js-toolkit';
const jsToolkitIndexUrl = `/js-toolkit@${jsToolkitVersion}/index.js`;
const jsToolkitUtilsUrl = `/js-toolkit@${jsToolkitVersion}/utils/index.js`;

// Mapbox GL and its optional geocoder are NOT bundled or served by this CDN: they stay bare,
// external specifiers so the Mapbox components resolve them from the consuming page's import map
// (or an injected instance via `provideMapboxGl`). This sidesteps redistributing the proprietary
// Mapbox GL build and lets strict-CSP consumers self-host the same-origin GL worker.
const mapboxExternalSpecifiers = ['mapbox-gl', '@mapbox/mapbox-gl-geocoder'] as const;

const packageDirectories = {
  '@studiometa/ui': resolve(repositoryDirectory, 'packages/ui'),
  '@studiometa/ui-mapbox': resolve(repositoryDirectory, 'packages/ui-mapbox'),
} as const;
const buildSourcePathspecs = [
  'package.json',
  'package-lock.json',
  'packages/cdn/package.json',
  'packages/cdn/scripts',
  'packages/cdn/src',
  'packages/cdn/size-budgets.json',
  'packages/ui',
  'packages/ui-mapbox',
] as const;

interface SizeBudgets {
  schemaVersion: number;
  bytes: Record<string, number>;
}

interface ComponentDefinition {
  token: string;
  packageName: keyof typeof packageDirectories;
  subpath: string;
  exportName: string;
  strategy: string;
  group: string;
  children: readonly string[];
  styles: readonly string[];
  integrations: readonly string[];
  sourcePath: string;
}

function toPosix(path: string): string {
  return path.split(sep).join('/');
}

function parseBuildOptions(): { outputDirectory: string; allowDirty: boolean } {
  const index = process.argv.indexOf('--outdir');
  const value = index === -1 ? undefined : process.argv[index + 1];
  if (index !== -1 && (!value || value.startsWith('--'))) {
    throw new Error('--outdir requires a path.');
  }

  const outputDirectory = resolve(packageDirectory, value ?? defaultOutputDirectory);
  const relativeOutput = relative(packageDirectory, outputDirectory);
  if (relativeOutput.startsWith('..') || isAbsolute(relativeOutput)) {
    throw new Error('The CDN output directory must stay inside packages/cdn.');
  }
  return { outputDirectory, allowDirty: process.argv.includes('--allow-dirty') };
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sortValue(child)]),
    );
  }
  return value;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(sortValue(value), null, 2)}\n`);
}

function runGit(...args: string[]): string {
  return execFileSync('git', args, {
    cwd: repositoryDirectory,
    encoding: 'utf8',
  }).trim();
}

function nullSeparated(value: string): string[] {
  return value.split('\0').filter(Boolean);
}

async function sourceState(): Promise<{
  clean: boolean;
  dirtyFiles: string[];
  digest: string;
}> {
  const unstaged = nullSeparated(
    runGit('diff', '--name-only', '-z', '--', ...buildSourcePathspecs),
  );
  const staged = nullSeparated(
    runGit('diff', '--cached', '--name-only', '-z', 'HEAD', '--', ...buildSourcePathspecs),
  );
  const dirtyFiles = [...new Set([...unstaged, ...staged])].sort();
  const trackedFiles = [
    ...new Set([
      ...nullSeparated(runGit('ls-files', '-z', 'HEAD', '--', ...buildSourcePathspecs)),
      ...nullSeparated(runGit('ls-files', '-z', '--', ...buildSourcePathspecs)),
    ]),
  ].sort();
  const hash = createHash('sha256').update('studiometa-browser-cdn-source-tree-v1\0');
  for (const file of trackedFiles) {
    hash.update(file).update('\0');
    const contents = await readFile(resolve(repositoryDirectory, file)).catch(() => undefined);
    if (contents) hash.update('file\0').update(contents).update('\0');
    else hash.update('missing\0');
  }
  return { clean: dirtyFiles.length === 0, dirtyFiles, digest: hash.digest('hex') };
}

function reproducibleBuildTime(): { epoch: number; iso: string; source: string } {
  const sourceDateEpoch = process.env.SOURCE_DATE_EPOCH;
  const rawEpoch = sourceDateEpoch ?? runGit('show', '-s', '--format=%ct', 'HEAD');
  const epoch = Number(rawEpoch);
  if (!Number.isSafeInteger(epoch) || epoch < 0) {
    throw new Error(`Invalid SOURCE_DATE_EPOCH: ${rawEpoch}`);
  }
  return {
    epoch,
    iso: new Date(epoch * 1_000).toISOString(),
    source: sourceDateEpoch === undefined ? 'git-commit-timestamp' : 'SOURCE_DATE_EPOCH',
  };
}

async function componentDefinitions(): Promise<ComponentDefinition[]> {
  const definitions: ComponentDefinition[] = [];

  for (const catalog of componentCatalogs) {
    const directory = packageDirectories[catalog.packageName];
    const metadata = JSON.parse(await readFile(resolve(directory, 'package.json'), 'utf8'));
    for (const component of catalog.components) {
      const subpath = component.subpath ?? component.token;
      const exportName = component.exportName ?? component.token;
      const exportTarget =
        metadata.exports[`./${subpath}`] ?? metadata.exports['./*'].replace('*', subpath);
      definitions.push({
        token: component.token,
        packageName: catalog.packageName,
        subpath,
        exportName,
        strategy: catalog.strategy,
        group: component.group,
        children: component.children ?? [],
        styles: component.styles ?? [],
        integrations: component.integrations ?? [],
        sourcePath: resolve(directory, exportTarget),
      });
    }
  }

  return definitions.sort((left, right) => left.token.localeCompare(right.token));
}

/**
 * CDN-only Shopify policy.
 *
 * The preview `@shopify/partial-rendering` adapter is an optional peer, is absent from the
 * lockfile, and is not available from the public npm registry. Transform only its computed
 * import into an explicit runtime diagnostic so the component safely uses its documented
 * base-Fetch fallback instead of emitting an unresolved browser import. Remove this policy
 * when a browser-ready adapter can be pinned in this workspace.
 */
function shopifyFallbackPlugin(): Plugin {
  const sourcePath = resolve(repositoryDirectory, 'packages/ui/Fetch/FetchShopifyPartial.ts');
  return {
    name: 'cdn-shopify-partial-rendering-policy',
    setup(build) {
      build.onLoad({ filter: /FetchShopifyPartial\.ts$/ }, async (args) => {
        if (resolve(args.path) !== sourcePath) return undefined;
        const source = await readFile(args.path, 'utf8');
        const original = '    return import(this.__PARTIALS_MODULE);';
        if (!source.includes(original)) {
          throw new Error('The CDN Shopify fallback transform is stale.');
        }
        const replacement = [
          "    console.warn('[@studiometa/ui-cdn] Shopify partial rendering is unavailable in this CDN build; falling back to Fetch.');",
          "    throw new Error('The optional @shopify/partial-rendering adapter is excluded from this CDN build.');",
        ].join('\n');
        return { contents: source.replace(original, replacement), loader: 'ts' };
      });
    },
  };
}

/**
 * Rewrites every `@studiometa/js-toolkit` (and `/utils`) import in the ui tree to the absolute,
 * origin-relative URL of the separately built, versioned js-toolkit artifact and marks it external.
 * This keeps js-toolkit out of the ui bundle so autoload, every component chunk, the ui barrel, and
 * a manual `import '/js-toolkit@<version>/index.js'` all resolve to one browser module URL — one
 * runtime instance and one component registry.
 */
function externalizeToolkitPlugin(): Plugin {
  const mapping: Record<string, string> = {
    '@studiometa/js-toolkit': jsToolkitIndexUrl,
    '@studiometa/js-toolkit/utils': jsToolkitUtilsUrl,
  };
  return {
    name: 'cdn-externalize-js-toolkit',
    setup(build) {
      build.onResolve({ filter: /^@studiometa\/js-toolkit(?:\/utils)?$/ }, (args) => {
        const path = mapping[args.path];
        if (!path) return undefined;
        return { path, external: true };
      });
    },
  };
}

function outputKeyForPath(metafile: Metafile, absolutePath: string): string {
  const normalized = resolve(absolutePath);
  const output = Object.keys(metafile.outputs).find(
    (key) => resolve(repositoryDirectory, key) === normalized,
  );
  if (!output) throw new Error(`Missing metafile output for ${absolutePath}`);
  return output;
}

function importedOutputKey(metafile: Metafile, importer: string, imported: string): string {
  if (metafile.outputs[imported]) return imported;
  const resolved = toPosix(resolve(dirname(resolve(repositoryDirectory, importer)), imported));
  const output = Object.keys(metafile.outputs).find(
    (key) => toPosix(resolve(repositoryDirectory, key)) === resolved,
  );
  if (!output) throw new Error(`Missing imported output ${imported} from ${importer}`);
  return output;
}

function staticOutputGraph(metafile: Metafile, root: string): string[] {
  const visited = new Set<string>();
  function visit(output: string) {
    if (visited.has(output)) return;
    visited.add(output);
    for (const imported of metafile.outputs[output].imports) {
      if (imported.external || imported.kind === 'dynamic-import') continue;
      visit(importedOutputKey(metafile, output, imported.path));
    }
  }
  visit(root);
  return [...visited].sort();
}

function graphInputs(metafile: Metafile, root: string): string[] {
  return staticOutputGraph(metafile, root)
    .flatMap((output) => Object.keys(metafile.outputs[output].inputs))
    .filter((input, index, inputs) => inputs.indexOf(input) === index)
    .sort();
}

function dynamicOutputEntries(metafile: Metafile, root: string): string[] {
  return staticOutputGraph(metafile, root)
    .flatMap((output) =>
      metafile.outputs[output].imports
        .filter((imported) => !imported.external && imported.kind === 'dynamic-import')
        .map((imported) => importedOutputKey(metafile, output, imported.path)),
    )
    .filter((output, index, outputs) => outputs.indexOf(output) === index)
    .sort();
}

function publicPath(outputDirectory: string, outputKey: string): string {
  return toPosix(relative(outputDirectory, resolve(repositoryDirectory, outputKey)));
}

function assertDoesNotContain(
  inputs: readonly string[],
  patterns: readonly RegExp[],
  label: string,
) {
  const matches = inputs.filter((input) =>
    patterns.some((pattern) => pattern.test(toPosix(input))),
  );
  if (matches.length > 0) {
    throw new Error(`${label} unexpectedly contains ${matches.join(', ')}`);
  }
}

function collectExternalImports(metafile: Metafile): string[] {
  const external = new Set<string>();
  for (const metadata of Object.values(metafile.outputs)) {
    for (const imported of metadata.imports) {
      if (imported.external) external.add(imported.path);
    }
  }
  return [...external].sort();
}

/**
 * Asserts the ui tree's externalization invariants and returns the external specifiers, split into
 * the js-toolkit URLs and the Mapbox specifiers:
 *
 * - js-toolkit is imported only through its single absolute URL(s), and the main index URL — the
 *   module that owns the shared component registry — is present, with no js-toolkit source bundled.
 * - Mapbox GL and the optional geocoder are imported only as their bare specifiers (resolved by the
 *   consumer's import map) and neither library's source is bundled anywhere in the tree.
 * - No other external import is allowed.
 */
function assertUiExternals(metafile: Metafile): {
  toolkitUrls: string[];
  mapboxSpecifiers: string[];
} {
  const external = collectExternalImports(metafile);
  const allowed = new Set<string>([
    jsToolkitIndexUrl,
    jsToolkitUtilsUrl,
    ...mapboxExternalSpecifiers,
  ]);
  const disallowed = external.filter((url) => !allowed.has(url));
  if (disallowed.length > 0) {
    throw new Error(`The ui tree has unexpected external imports: ${disallowed.join(', ')}`);
  }
  if (!external.includes(jsToolkitIndexUrl)) {
    throw new Error(`The ui tree does not import the js-toolkit URL ${jsToolkitIndexUrl}.`);
  }
  for (const specifier of mapboxExternalSpecifiers) {
    if (!external.includes(specifier)) {
      throw new Error(`The ui tree does not import Mapbox through the external specifier ${specifier}.`);
    }
  }
  const bundled = Object.keys(metafile.inputs).filter((input) =>
    [
      'node_modules/@studiometa/js-toolkit/',
      'node_modules/mapbox-gl/',
      'node_modules/@mapbox/mapbox-gl-geocoder/',
    ].some((needle) => toPosix(input).includes(needle)),
  );
  if (bundled.length > 0) {
    throw new Error(
      `The ui tree bundled externalized dependency source instead of externalizing it: ${bundled.join(', ')}`,
    );
  }
  return {
    toolkitUrls: external.filter((url) => url === jsToolkitIndexUrl || url === jsToolkitUtilsUrl),
    mapboxSpecifiers: external.filter((url) =>
      (mapboxExternalSpecifiers as readonly string[]).includes(url),
    ),
  };
}

async function listFiles(directory: string, root = directory): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(path, root)));
    else files.push(toPosix(relative(root, path)));
  }
  return files.sort();
}

async function fileSizes(outputDirectory: string, files: readonly string[]) {
  return Object.fromEntries(
    await Promise.all(
      files.map(async (file) => [file, (await stat(resolve(outputDirectory, file))).size] as const),
    ),
  );
}

async function writeThirdPartyNotices(metafile: Metafile, outputDirectory: string): Promise<void> {
  const packageRoots = new Set<string>();
  for (const input of Object.keys(metafile.inputs)) {
    const normalized = toPosix(input);
    const matches = [...normalized.matchAll(/(?:^|\/)node_modules\/((?:@[^/]+\/)?[^/]+)/g)];
    const match = matches.at(-1);
    if (!match) continue;
    const end = (match.index ?? 0) + match[0].length;
    packageRoots.add(resolve(repositoryDirectory, normalized.slice(0, end)));
  }

  const notices: Array<{ name: string; content: string }> = [];
  for (const packageRoot of packageRoots) {
    const metadata = JSON.parse(await readFile(resolve(packageRoot, 'package.json'), 'utf8'));
    const licensePath = (
      await Promise.all(
        ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'COPYING'].map(async (name) => {
          const path = resolve(packageRoot, name);
          return (await stat(path).catch(() => undefined))?.isFile() ? path : undefined;
        }),
      )
    ).find(Boolean);
    const licenseText = licensePath
      ? (await readFile(licensePath, 'utf8')).trim()
      : `No license file was included by this dependency. Declared package license: ${metadata.license ?? 'unspecified'}.`;
    notices.push({
      name: `${metadata.name}@${metadata.version} (${metadata.license ?? 'license unspecified'})`,
      content: licenseText,
    });
  }

  notices.sort((left, right) => left.name.localeCompare(right.name));
  const separator =
    '\n\n================================================================================\n\n';
  const contents = notices
    .map(({ name, content }) => `${name}\n${'-'.repeat(name.length)}\n\n${content}`)
    .join(separator);
  await mkdir(resolve(outputDirectory, 'licenses'), { recursive: true });
  await writeFile(resolve(outputDirectory, 'licenses/THIRD_PARTY_LICENSES.txt'), `${contents}\n`);
}

async function assertBrowserImports(
  metafile: Metafile,
  outputDirectory: string,
  files: readonly string[],
  allowedExternalUrls: ReadonlySet<string>,
) {
  const externalImports = Object.entries(metafile.outputs).flatMap(([output, metadata]) =>
    metadata.imports
      .filter((imported) => imported.external && !allowedExternalUrls.has(imported.path))
      .map((imported) => `${output}: ${imported.path}`),
  );
  if (externalImports.length > 0) {
    throw new Error(`Unresolved external browser imports: ${externalImports.join(', ')}`);
  }

  const dynamicLiteralPattern = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const file of files.filter((path) => path.endsWith('.js'))) {
    const source = await readFile(resolve(outputDirectory, file), 'utf8');
    for (const match of source.matchAll(dynamicLiteralPattern)) {
      const specifier = match[1];
      // Bare specifiers are allowed only when they are declared externals resolved by the
      // consumer's import map (Mapbox GL and the geocoder); anything else must be relative or a URL.
      if (
        !allowedExternalUrls.has(specifier) &&
        !specifier.startsWith('.') &&
        !specifier.startsWith('/') &&
        !URL.canParse(specifier)
      ) {
        throw new Error(`Unresolved bare dynamic import ${specifier} in ${file}.`);
      }
    }
    if (source.includes('import("@shopify/partial-rendering")')) {
      throw new Error(`The excluded Shopify adapter remains importable in ${file}.`);
    }
  }
}

function graphBytes(
  outputDirectory: string,
  sizes: Record<string, number>,
  outputs: Iterable<string>,
): number {
  return [...new Set(outputs)].reduce(
    (total, output) => total + sizes[publicPath(outputDirectory, output)],
    0,
  );
}

function measureUiSizeBudgets(
  metafile: Metafile,
  outputDirectory: string,
  entryOutputs: Record<string, string>,
  componentOutputBySource: ReadonlyMap<string, string>,
  definitions: readonly ComponentDefinition[],
  sizes: Record<string, number>,
): Record<string, number> {
  const observed: Record<string, number> = {};
  for (const [name, output] of Object.entries(entryOutputs)) {
    observed[`entry:${name}`] = sizes[publicPath(outputDirectory, output)];
    observed[`initial:${name}`] = graphBytes(
      outputDirectory,
      sizes,
      staticOutputGraph(metafile, output),
    );
  }

  function componentOutput(token: string): string {
    const definition = definitions.find((component) => component.token === token);
    const output = definition && componentOutputBySource.get(definition.sourcePath);
    if (!output) throw new Error(`Missing size-budget component output for ${token}.`);
    return output;
  }
  observed['graph:component:Action'] = graphBytes(
    outputDirectory,
    sizes,
    staticOutputGraph(metafile, componentOutput('Action')),
  );
  observed['graph:family:Accordion'] = graphBytes(
    outputDirectory,
    sizes,
    definitions
      .filter(({ group }) => group === 'accordion')
      .flatMap(({ token }) => staticOutputGraph(metafile, componentOutput(token))),
  );

  // The Mapbox core/geocoder graph and stylesheet budgets are gone: Mapbox GL and the geocoder are
  // external (import-map resolved) and neither their JavaScript nor their CSS is served here.
  return observed;
}

function measureJsToolkitSizeBudgets(
  metafile: Metafile,
  outputDirectory: string,
  entryOutputs: Record<string, string>,
  sizes: Record<string, number>,
): Record<string, number> {
  const observed: Record<string, number> = {};
  for (const [name, output] of Object.entries(entryOutputs)) {
    observed[`js-toolkit:entry:${name}`] = sizes[publicPath(outputDirectory, output)];
    observed[`js-toolkit:initial:${name}`] = graphBytes(
      outputDirectory,
      sizes,
      staticOutputGraph(metafile, output),
    );
  }
  return observed;
}

function enforceSizeBudgets(observed: Record<string, number>): void {
  if (sizeBudgets.schemaVersion !== 1) throw new Error('Unsupported size budget schema.');
  const measuredNames = Object.keys(observed).sort();
  const budgetNames = Object.keys(sizeBudgets.bytes).sort();
  if (JSON.stringify(measuredNames) !== JSON.stringify(budgetNames)) {
    const unmeasured = budgetNames.filter((name) => !(name in observed));
    const unbudgeted = measuredNames.filter((name) => !(name in sizeBudgets.bytes));
    throw new Error(
      `Size budget keys do not match measurements (unmeasured: ${unmeasured.join(', ') || 'none'}; unbudgeted: ${unbudgeted.join(', ') || 'none'}).`,
    );
  }
  for (const [name, maximum] of Object.entries(sizeBudgets.bytes)) {
    if (observed[name] > maximum) {
      throw new Error(`Size budget ${name} exceeded: ${observed[name]} > ${maximum} bytes.`);
    }
  }
}

async function sha384(path: string): Promise<string> {
  return `sha384-${createHash('sha384')
    .update(await readFile(path))
    .digest('base64')}`;
}

function sharedEsbuildOptions() {
  return {
    absWorkingDir: repositoryDirectory,
    bundle: true,
    splitting: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    entryNames: '[dir]/[name]',
    chunkNames: 'chunks/[name]-[hash]',
    assetNames: 'assets/[name]-[hash]',
    sourcemap: true,
    metafile: true,
    minify: true,
    legalComments: 'eof',
    charset: 'utf8',
    define: { __DEV__: 'false' },
    logLevel: 'info',
  } as const;
}

const { outputDirectory, allowDirty } = parseBuildOptions();
const uiTreePrefix = `releases/ui/${uiVersion}`;
const jsToolkitTreePrefix = `releases/js-toolkit/${jsToolkitVersion}`;
const uiOutputDirectory = resolve(outputDirectory, uiTreePrefix);
const jsToolkitOutputDirectory = resolve(outputDirectory, jsToolkitTreePrefix);

const currentSourceState = await sourceState();
if (!currentSourceState.clean && !allowDirty) {
  throw new Error(
    `Refusing a release-style CDN build with tracked build sources changed: ${currentSourceState.dirtyFiles.join(', ')}. Commit or restore these files, or pass --allow-dirty for explicitly non-publishable local output.`,
  );
}
const definitions = await componentDefinitions();
await rm(outputDirectory, { recursive: true, force: true });
await mkdir(uiOutputDirectory, { recursive: true });
await mkdir(jsToolkitOutputDirectory, { recursive: true });

const buildTime = reproducibleBuildTime();
const commit = runGit('rev-parse', 'HEAD');
const cleanBuildIdentifier = `${uiVersion}+${commit}`;
const buildIdentifier = currentSourceState.clean
  ? cleanBuildIdentifier
  : `${cleanBuildIdentifier}.dirty.${currentSourceState.digest}`;

// Pass A — the versioned js-toolkit artifact. It is bundled fully (no externals) so its own
// internal chunks resolve relatively within its tree, and the ui tree can import it by URL.
const jsToolkitResult = await esbuild.build({
  ...sharedEsbuildOptions(),
  entryPoints: {
    index: 'packages/cdn/src/barrel-js-toolkit.ts',
    'utils/index': 'packages/cdn/src/barrel-js-toolkit-utils.ts',
  },
  outdir: jsToolkitOutputDirectory,
});

// Every @studiometa/ui and @studiometa/ui-mapbox component is emitted as a stable, non-hashed ESM
// entry named `<subpath>.js` at the ui tree root, so a consumer can import a single component by a
// path that mirrors the npm subpath export (e.g. `/ui@<ref>/Action.js`). Pointing an entry straight
// at the component source module re-exports its public exports. js-toolkit gets no per-symbol files
// (pass A keeps only index.js + utils/index.js). Subpaths must not collide with the reserved ui
// entries (autoload/loader/manifest/index) and no two components may share a subpath — both trees
// share this one ui release tree.
const reservedUiEntryNames = new Set(['autoload', 'loader', 'manifest', 'index']);
const componentEntryPoints: Record<string, string> = {};
for (const definition of definitions) {
  const entryName = definition.subpath;
  if (reservedUiEntryNames.has(entryName)) {
    throw new Error(`Component subpath "${entryName}" collides with a reserved ui entry name.`);
  }
  const source = toPosix(relative(repositoryDirectory, definition.sourcePath));
  const existing = componentEntryPoints[entryName];
  if (existing && existing !== source) {
    throw new Error(`Two components share the CDN subpath "${entryName}".`);
  }
  componentEntryPoints[entryName] = source;
}

// Pass B — the @studiometa/ui tree. js-toolkit is rewritten to its external, versioned URL and the
// ui barrel is emitted as index.js. Autoload, loader, manifest, every stable component entry and
// the barrel now import the single external js-toolkit URL and carry no js-toolkit source.
const uiResult = await esbuild.build({
  ...sharedEsbuildOptions(),
  entryPoints: {
    autoload: 'packages/cdn/src/autoload.ts',
    loader: 'packages/cdn/src/loader.ts',
    manifest: 'packages/cdn/src/manifest.ts',
    index: 'packages/cdn/src/barrel-ui.ts',
    ...componentEntryPoints,
  },
  outdir: uiOutputDirectory,
  external: [...mapboxExternalSpecifiers],
  plugins: [shopifyFallbackPlugin(), externalizeToolkitPlugin()],
});

// Mapbox GL and the geocoder are external (import-map resolved) and no longer bundled, so the CDN
// serves neither their JavaScript, their stylesheets nor their license notices — consumers load
// those from the same source they point their import map at.
await writeThirdPartyNotices(uiResult.metafile, uiOutputDirectory);
await writeThirdPartyNotices(jsToolkitResult.metafile, jsToolkitOutputDirectory);

const uiEntryNames = ['autoload', 'loader', 'manifest', 'index'];
const entryOutputs = Object.fromEntries(
  uiEntryNames.map((name) => [
    name,
    outputKeyForPath(uiResult.metafile, resolve(uiOutputDirectory, `${name}.js`)),
  ]),
);
const componentOutputBySource = new Map<string, string>();
for (const [output, metadata] of Object.entries(uiResult.metafile.outputs)) {
  if (!metadata.entryPoint) continue;
  componentOutputBySource.set(resolve(repositoryDirectory, metadata.entryPoint), output);
}

// The Mapbox component family stays lazy, and the Mapbox libraries are external (import-map
// resolved), so neither the component source nor the libraries may appear in the startup graph or
// in any @studiometa/ui component graph. That the library source is bundled nowhere at all is
// enforced globally by `assertUiExternals`.
const uiMapboxSourcePattern = /(?:^|\/)packages\/ui-mapbox\//;
const mapboxLibPatterns = [
  /(?:^|\/)node_modules\/mapbox-gl\//,
  /(?:^|\/)node_modules\/@mapbox\/mapbox-gl-geocoder\//,
];
const mapboxIsolationPatterns = [uiMapboxSourcePattern, ...mapboxLibPatterns];
for (const name of uiEntryNames) {
  const inputs = graphInputs(uiResult.metafile, entryOutputs[name]);
  assertDoesNotContain(inputs, mapboxIsolationPatterns, `${name} startup graph`);
}
const uiDefinitions = definitions.filter(({ packageName }) => packageName === '@studiometa/ui');
for (const definition of uiDefinitions) {
  const output = componentOutputBySource.get(definition.sourcePath);
  if (!output) throw new Error(`Missing component output for ${definition.token}.`);
  assertDoesNotContain(
    graphInputs(uiResult.metafile, output),
    mapboxIsolationPatterns,
    `${definition.token} graph`,
  );
}
const actionDefinition = definitions.find(({ token }) => token === 'Action');
const actionOutput = actionDefinition && componentOutputBySource.get(actionDefinition.sourcePath);
if (!actionOutput) throw new Error('Missing Action output for unrelated-family isolation.');
assertDoesNotContain(
  graphInputs(uiResult.metafile, actionOutput),
  [/(?:^|\/)packages\/ui\/Accordion\//],
  'Action graph',
);

const { toolkitUrls: toolkitExternalUrls, mapboxSpecifiers: mapboxExternalSpecifiersFound } =
  assertUiExternals(uiResult.metafile);
const toolkitIdentity = `@studiometa/js-toolkit@${jsToolkitVersion}`;

const uiInitialFiles = (await listFiles(uiOutputDirectory)).filter(
  (file) => !file.endsWith('.json'),
);
await assertBrowserImports(
  uiResult.metafile,
  uiOutputDirectory,
  uiInitialFiles,
  new Set([...toolkitExternalUrls, ...mapboxExternalSpecifiersFound]),
);
for (const file of uiInitialFiles.filter((path) => path.endsWith('.js'))) {
  if (!uiInitialFiles.includes(`${file}.map`))
    throw new Error(`Missing public sourcemap for ${file}.`);
}
const uiSizes = await fileSizes(uiOutputDirectory, uiInitialFiles);

const jsToolkitEntryOutputs = Object.fromEntries(
  (
    [
      ['index', 'index.js'],
      ['utils', 'utils/index.js'],
    ] as const
  ).map(([name, file]) => [
    name,
    outputKeyForPath(jsToolkitResult.metafile, resolve(jsToolkitOutputDirectory, file)),
  ]),
);
for (const name of Object.keys(jsToolkitEntryOutputs)) {
  assertDoesNotContain(
    graphInputs(jsToolkitResult.metafile, jsToolkitEntryOutputs[name]),
    mapboxIsolationPatterns,
    `js-toolkit ${name} graph`,
  );
}
const jsToolkitInitialFiles = (await listFiles(jsToolkitOutputDirectory)).filter(
  (file) => !file.endsWith('.json'),
);
await assertBrowserImports(
  jsToolkitResult.metafile,
  jsToolkitOutputDirectory,
  jsToolkitInitialFiles,
  new Set(),
);
for (const file of jsToolkitInitialFiles.filter((path) => path.endsWith('.js'))) {
  if (!jsToolkitInitialFiles.includes(`${file}.map`))
    throw new Error(`Missing public sourcemap for ${file}.`);
}
const jsToolkitSizes = await fileSizes(jsToolkitOutputDirectory, jsToolkitInitialFiles);

const observedBudgets: Record<string, number> = {
  ...measureUiSizeBudgets(
    uiResult.metafile,
    uiOutputDirectory,
    entryOutputs,
    componentOutputBySource,
    definitions,
    uiSizes,
  ),
  ...measureJsToolkitSizeBudgets(
    jsToolkitResult.metafile,
    jsToolkitOutputDirectory,
    jsToolkitEntryOutputs,
    jsToolkitSizes,
  ),
};
// Totals span both trees, so they are measured over the whole dist listing (dist-relative paths
// are unique, unlike the tree-relative keys of uiSizes/jsToolkitSizes which both contain index.js).
const distFilesBeforeMetadata = await listFiles(outputDirectory);
const distSizesBeforeMetadata = await fileSizes(outputDirectory, distFilesBeforeMetadata);
observedBudgets['total:esm'] = Object.entries(distSizesBeforeMetadata)
  .filter(([file]) => file.endsWith('.js'))
  .reduce((total, [, bytes]) => total + bytes, 0);
observedBudgets['total:source-maps'] = Object.entries(distSizesBeforeMetadata)
  .filter(([file]) => file.endsWith('.map'))
  .reduce((total, [, bytes]) => total + bytes, 0);
observedBudgets['total:release'] = 0;

const verifiedSourceState = await sourceState();
if (JSON.stringify(verifiedSourceState) !== JSON.stringify(currentSourceState)) {
  throw new Error('Tracked build sources changed while the CDN build was running.');
}

function outputMetadataFor(
  files: readonly string[],
  sizes: Record<string, number>,
): Record<string, { bytes: number; type: string }> {
  return Object.fromEntries(
    files.map((file) => [
      file,
      {
        bytes: sizes[file],
        type: file.endsWith('.map')
          ? 'source-map'
          : file.endsWith('.css')
            ? 'style'
            : file.endsWith('.js')
              ? 'module'
              : 'notice',
      },
    ]),
  );
}

function entryMetadataFor(
  metafile: Metafile,
  outputDirectory: string,
  entries: Record<string, string>,
): Record<string, { path: string; sourceMap: string; preload: string[] }> {
  return Object.fromEntries(
    Object.entries(entries).map(([name, output]) => {
      const path = publicPath(outputDirectory, output);
      return [
        name,
        {
          path,
          sourceMap: `${path}.map`,
          preload: staticOutputGraph(metafile, output)
            .map((dependency) => publicPath(outputDirectory, dependency))
            .filter((dependency) => dependency !== path)
            .sort(),
        },
      ];
    }),
  );
}

const componentInventory = Object.fromEntries(
  definitions.map((definition) => {
    const output = componentOutputBySource.get(definition.sourcePath);
    if (!output) throw new Error(`Missing component entry chunk for ${definition.token}.`);
    const graph = staticOutputGraph(uiResult.metafile, output).map((dependency) =>
      publicPath(uiOutputDirectory, dependency),
    );
    const entry = publicPath(uiOutputDirectory, output);
    const dynamicImports = dynamicOutputEntries(uiResult.metafile, output).map((dynamicOutput) => {
      const dynamicEntry = publicPath(uiOutputDirectory, dynamicOutput);
      return {
        entry: dynamicEntry,
        preload: staticOutputGraph(uiResult.metafile, dynamicOutput)
          .map((dependency) => publicPath(uiOutputDirectory, dependency))
          .filter((dependency) => dependency !== dynamicEntry)
          .sort(),
      };
    });
    return [
      definition.token,
      {
        packageName: definition.packageName,
        subpath: definition.subpath,
        exportName: definition.exportName,
        strategy: definition.strategy,
        group: definition.group,
        children: [...definition.children].sort(),
        styles: [...definition.styles].sort(),
        integrations: [...definition.integrations].sort(),
        entry,
        preload: graph.filter((path) => path !== entry).sort(),
        dynamicImports,
      },
    ];
  }),
);

const mapboxComponents = definitions
  .filter(({ packageName }) => packageName === '@studiometa/ui-mapbox')
  .map(({ token }) => token);

const uiBuildMetadata = {
  schemaVersion: 1,
  format: {
    name: 'studiometa-browser-cdn',
    version: 1,
    module: 'esm',
    target: 'es2020',
    splitting: true,
    sourcemaps: true,
    bundler: `esbuild@${esbuild.version}`,
  },
  package: { name: packageMetadata.name, version: uiVersion },
  dependencies: { '@studiometa/js-toolkit': jsToolkitVersion },
  build: {
    commit,
    identifier: buildIdentifier,
    clean: currentSourceState.clean,
    publishable: currentSourceState.clean,
    dirtyFiles: currentSourceState.dirtyFiles,
    sourceTree: {
      algorithm: 'sha256',
      digest: currentSourceState.digest,
      scheme: 'sorted-path-and-working-tree-content-v1',
      verified: true,
      pathspecs: buildSourcePathspecs,
    },
    createdAt: buildTime.iso,
    sourceDateEpoch: buildTime.epoch,
    timeSource: buildTime.source,
  },
  identifiers: {
    immutable: {
      value: buildIdentifier,
      suppliedBy: currentSourceState.clean ? 'clean-commit' : 'dirty-source-tree-digest',
      mutable: false,
      publishable: currentSourceState.clean,
    },
    stable: {
      value: uiVersion,
      suppliedBy: 'package-version',
      mutable: false,
    },
    main: {
      value: 'main',
      suppliedBy: 'future-deployment-alias',
      mutable: true,
    },
  },
  entries: entryMetadataFor(uiResult.metafile, uiOutputDirectory, entryOutputs),
  components: componentInventory,
  outputs: outputMetadataFor(uiInitialFiles, uiSizes),
  // The CDN serves no stylesheets: Mapbox GL and the geocoder — the only components that needed
  // one — are external, so consumers load their CSS from the source their import map points at.
  styles: {},
  licenses: {
    thirdPartyNotices: 'licenses/THIRD_PARTY_LICENSES.txt',
    esbuildLegalComments: 'eof',
  },
  // The public Mapbox-redistribution review gate is gone: this CDN no longer serves Mapbox GL or
  // the geocoder (their JavaScript, stylesheets and license notices), so there is nothing to review.
  releaseGates: {},
  integrations: {
    'mapbox-gl': {
      status: 'external-import-map',
      importSpecifier: 'mapbox-gl',
      components: mapboxComponents,
      note: 'mapbox-gl is not bundled or served by this CDN. The Mapbox components resolve it from the consuming page (an import map entry for "mapbox-gl", or an instance injected through provideMapboxGl). Because the consumer owns the mapbox-gl module, its GL worker is same-origin with the page, so strict-CSP consumers can self-host it without a blob: worker-src exception.',
    },
    'mapbox-geocoder': {
      status: 'external-import-map',
      importSpecifier: '@mapbox/mapbox-gl-geocoder',
      components: ['MapboxGeocoder'],
      note: 'The optional geocoder is not bundled or served by this CDN. MapboxGeocoder resolves it from the consuming page (an import map entry for "@mapbox/mapbox-gl-geocoder", or an instance injected through provideMapboxGeocoder).',
    },
    'shopify-partial-rendering': {
      status: 'excluded-with-runtime-fallback',
      requestedSpecifier: '@shopify/partial-rendering',
      components: ['FetchShopifyPartial'],
      reason:
        'The optional preview adapter is absent from the lockfile and unavailable from the public npm registry; the CDN component diagnoses this and falls back to Fetch.',
    },
    'js-toolkit': {
      status: 'external-versioned-artifact',
      version: jsToolkitVersion,
      urls: toolkitExternalUrls,
      release: jsToolkitTreePrefix,
      note: 'js-toolkit is built as its own versioned artifact and imported by an absolute, origin-relative URL so every ui output shares one runtime instance.',
    },
  },
  preload: {
    semantics:
      'Each preload list contains sorted transitive static ESM dependencies; order is not significant, and dynamic component and optional-integration edges are excluded.',
  },
  assertions: {
    jsToolkitIdentities: [toolkitIdentity],
    jsToolkitExternalUrls: toolkitExternalUrls,
    uiTreeBundlesToolkit: false,
    mapboxExternalSpecifiers: mapboxExternalSpecifiersFound,
    uiTreeBundlesMapbox: false,
    onlyAllowedBareExternals: true,
    publicSourceMaps: true,
    startupMapboxIsolated: true,
    uiComponentsMapboxIsolated: uiDefinitions.map(({ token }) => token),
    unrelatedFamilyIsolated: {
      component: 'Action',
      excludedFamily: 'Accordion',
    },
    sizeBudgets: observedBudgets,
  },
};

const jsToolkitBuildMetadata = {
  schemaVersion: 1,
  format: {
    name: 'studiometa-browser-cdn-js-toolkit',
    version: 1,
    module: 'esm',
    target: 'es2020',
    splitting: true,
    sourcemaps: true,
    bundler: `esbuild@${esbuild.version}`,
  },
  package: { name: JS_TOOLKIT_BUILD_NAME, version: jsToolkitVersion },
  build: {
    commit,
    identifier: `${JS_TOOLKIT_BUILD_NAME}@${jsToolkitVersion}+${commit}`,
    clean: currentSourceState.clean,
    publishable: currentSourceState.clean,
    createdAt: buildTime.iso,
    sourceDateEpoch: buildTime.epoch,
    timeSource: buildTime.source,
  },
  entries: entryMetadataFor(
    jsToolkitResult.metafile,
    jsToolkitOutputDirectory,
    jsToolkitEntryOutputs,
  ),
  components: {},
  outputs: outputMetadataFor(jsToolkitInitialFiles, jsToolkitSizes),
  licenses: {
    thirdPartyNotices: 'licenses/THIRD_PARTY_LICENSES.txt',
    esbuildLegalComments: 'eof',
  },
};

// The js-toolkit tree is fully self-contained, so its metadata is stable and written once. Its
// integrity manifest hashes every file including its own build.json.
await writeJson(resolve(jsToolkitOutputDirectory, 'build.json'), jsToolkitBuildMetadata);
{
  const integrityFiles = [...jsToolkitInitialFiles, 'build.json'].sort();
  const integrity = {
    schemaVersion: 1,
    algorithm: 'sha384',
    excludes: ['integrity.json'],
    files: Object.fromEntries(
      await Promise.all(
        integrityFiles.map(async (file) => [
          file,
          await sha384(resolve(jsToolkitOutputDirectory, file)),
        ]),
      ),
    ),
  };
  await writeJson(resolve(jsToolkitOutputDirectory, 'integrity.json'), integrity);
}

// The ui build.json records total:release, which depends on the byte size of build.json itself, so
// the metadata, integrity manifest and total-release measurement are iterated until they converge.
const uiIntegrityFiles = [...uiInitialFiles, 'build.json'].sort();
let releaseSizeConverged = false;
for (let attempt = 0; attempt < 5; attempt += 1) {
  await writeJson(resolve(uiOutputDirectory, 'build.json'), uiBuildMetadata);
  const integrity = {
    schemaVersion: 1,
    algorithm: 'sha384',
    excludes: ['integrity.json'],
    files: Object.fromEntries(
      await Promise.all(
        uiIntegrityFiles.map(async (file) => [
          file,
          await sha384(resolve(uiOutputDirectory, file)),
        ]),
      ),
    ),
  };
  await writeJson(resolve(uiOutputDirectory, 'integrity.json'), integrity);
  const releaseFiles = await listFiles(outputDirectory);
  const releaseSizes = await fileSizes(outputDirectory, releaseFiles);
  const measuredReleaseSize = Object.values(releaseSizes).reduce(
    (total, bytes) => total + bytes,
    0,
  );
  if (observedBudgets['total:release'] === measuredReleaseSize) {
    releaseSizeConverged = true;
    break;
  }
  observedBudgets['total:release'] = measuredReleaseSize;
}
if (!releaseSizeConverged) throw new Error('The total release size did not converge.');
enforceSizeBudgets(observedBudgets);

const totalPublicFiles = (await listFiles(outputDirectory)).length;
console.log(
  `Built ${definitions.length} components and ${totalPublicFiles} public files across ${uiTreePrefix} and ${jsToolkitTreePrefix}.`,
);
