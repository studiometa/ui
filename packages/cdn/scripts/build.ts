import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
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
const sizeBudgets = JSON.parse(
  await readFile(resolve(packageDirectory, 'size-budgets.json'), 'utf8'),
) as SizeBudgets;

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

async function assertSingleToolkitIdentity(metafile: Metafile): Promise<string> {
  const toolkitInputs = Object.keys(metafile.inputs).filter((input) =>
    toPosix(input).includes('node_modules/@studiometa/js-toolkit/'),
  );
  if (toolkitInputs.length === 0) throw new Error('The bundle contains no js-toolkit modules.');

  const identities = new Set<string>();
  for (const input of toolkitInputs) {
    const absolute = resolve(repositoryDirectory, input);
    const marker = `${sep}@studiometa${sep}js-toolkit${sep}`;
    const packageRoot = absolute.slice(0, absolute.indexOf(marker) + marker.length - 1);
    identities.add(await realpath(packageRoot));
  }
  if (identities.size !== 1) {
    throw new Error(`Expected one js-toolkit identity, found ${identities.size}.`);
  }

  const toolkitMetadata = JSON.parse(
    await readFile(resolve([...identities][0], 'package.json'), 'utf8'),
  );
  return `@studiometa/js-toolkit@${toolkitMetadata.version}`;
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
) {
  const externalImports = Object.entries(metafile.outputs).flatMap(([output, metadata]) =>
    metadata.imports
      .filter((imported) => imported.external)
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
      if (!specifier.startsWith('.') && !specifier.startsWith('/') && !URL.canParse(specifier)) {
        throw new Error(`Unresolved bare dynamic import ${specifier} in ${file}.`);
      }
    }
    if (source.includes('import("@shopify/partial-rendering")')) {
      throw new Error(`The excluded Shopify adapter remains importable in ${file}.`);
    }
  }
}

function graphBytes(
  metafile: Metafile,
  outputDirectory: string,
  sizes: Record<string, number>,
  outputs: Iterable<string>,
): number {
  return [...new Set(outputs)].reduce(
    (total, output) => total + sizes[publicPath(outputDirectory, output)],
    0,
  );
}

function measureSizeBudgets(
  metafile: Metafile,
  outputDirectory: string,
  entryOutputs: Record<string, string>,
  componentOutputBySource: ReadonlyMap<string, string>,
  definitions: readonly ComponentDefinition[],
  geocoderDynamicOutput: string,
  sizes: Record<string, number>,
) {
  const observed: Record<string, number> = {};
  for (const [name, output] of Object.entries(entryOutputs)) {
    observed[`entry:${name}`] = sizes[publicPath(outputDirectory, output)];
    observed[`initial:${name}`] = graphBytes(
      metafile,
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
    metafile,
    outputDirectory,
    sizes,
    staticOutputGraph(metafile, componentOutput('Action')),
  );
  observed['graph:family:Accordion'] = graphBytes(
    metafile,
    outputDirectory,
    sizes,
    definitions
      .filter(({ group }) => group === 'accordion')
      .flatMap(({ token }) => staticOutputGraph(metafile, componentOutput(token))),
  );

  const componentGraphs = definitions.map(({ token }) =>
    staticOutputGraph(metafile, componentOutput(token)),
  );
  const sharedToolkitChunks = Object.entries(metafile.outputs)
    .filter(([output, metadata]) => {
      if (metadata.entryPoint) return false;
      const hasToolkitInput = Object.keys(metadata.inputs).some((input) =>
        toPosix(input).includes('node_modules/@studiometa/js-toolkit/'),
      );
      const graphCount = componentGraphs.filter((graph) => graph.includes(output)).length;
      return hasToolkitInput && graphCount > 1;
    })
    .sort(
      ([left], [right]) =>
        sizes[publicPath(outputDirectory, right)] - sizes[publicPath(outputDirectory, left)] ||
        left.localeCompare(right),
    );
  const sharedToolkitChunk = sharedToolkitChunks[0]?.[0];
  if (!sharedToolkitChunk) throw new Error('Missing shared js-toolkit runtime chunk.');
  observed['chunk:js-toolkit-shared'] = sizes[publicPath(outputDirectory, sharedToolkitChunk)];

  observed['graph:mapbox-core'] = graphBytes(
    metafile,
    outputDirectory,
    sizes,
    staticOutputGraph(metafile, componentOutput('MapboxMap')),
  );
  const geocoderStaticGraph = new Set(
    staticOutputGraph(metafile, componentOutput('MapboxGeocoder')),
  );
  observed['graph:geocoder-incremental'] = graphBytes(
    metafile,
    outputDirectory,
    sizes,
    staticOutputGraph(metafile, geocoderDynamicOutput).filter(
      (output) => !geocoderStaticGraph.has(output),
    ),
  );
  observed['style:mapbox-gl'] = sizes['styles/mapbox-gl.css'];
  observed['style:mapbox-geocoder'] = sizes['styles/mapbox-gl-geocoder.css'];
  observed['total:esm'] = Object.entries(sizes)
    .filter(([file]) => file.endsWith('.js'))
    .reduce((total, [, bytes]) => total + bytes, 0);
  observed['total:source-maps'] = Object.entries(sizes)
    .filter(([file]) => file.endsWith('.map'))
    .reduce((total, [, bytes]) => total + bytes, 0);
  observed['total:release'] = 0;
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

const { outputDirectory, allowDirty } = parseBuildOptions();
const currentSourceState = await sourceState();
if (!currentSourceState.clean && !allowDirty) {
  throw new Error(
    `Refusing a release-style CDN build with tracked build sources changed: ${currentSourceState.dirtyFiles.join(', ')}. Commit or restore these files, or pass --allow-dirty for explicitly non-publishable local output.`,
  );
}
const definitions = await componentDefinitions();
await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

const result = await esbuild.build({
  absWorkingDir: repositoryDirectory,
  entryPoints: {
    autoload: 'packages/cdn/src/autoload.ts',
    loader: 'packages/cdn/src/loader.ts',
    manifest: 'packages/cdn/src/manifest.ts',
  },
  outdir: outputDirectory,
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  entryNames: '[name]',
  chunkNames: 'chunks/[name]-[hash]',
  assetNames: 'assets/[name]-[hash]',
  sourcemap: true,
  metafile: true,
  minify: true,
  legalComments: 'eof',
  charset: 'utf8',
  define: { __DEV__: 'false' },
  plugins: [shopifyFallbackPlugin()],
  logLevel: 'info',
});

await mkdir(resolve(outputDirectory, 'styles'), { recursive: true });
await copyFile(
  resolve(repositoryDirectory, 'node_modules/mapbox-gl/dist/mapbox-gl.css'),
  resolve(outputDirectory, 'styles/mapbox-gl.css'),
);
await copyFile(
  resolve(
    repositoryDirectory,
    'node_modules/@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css',
  ),
  resolve(outputDirectory, 'styles/mapbox-gl-geocoder.css'),
);
await writeThirdPartyNotices(result.metafile, outputDirectory);
await copyFile(
  resolve(repositoryDirectory, 'node_modules/mapbox-gl/LICENSE.txt'),
  resolve(outputDirectory, 'licenses/mapbox-gl-LICENSE.txt'),
);
await copyFile(
  resolve(repositoryDirectory, 'node_modules/@mapbox/mapbox-gl-geocoder/LICENSE'),
  resolve(outputDirectory, 'licenses/mapbox-gl-geocoder-LICENSE'),
);

const entryOutputs = Object.fromEntries(
  ['autoload', 'loader', 'manifest'].map((name) => [
    name,
    outputKeyForPath(result.metafile, resolve(outputDirectory, `${name}.js`)),
  ]),
);
const componentOutputBySource = new Map<string, string>();
for (const [output, metadata] of Object.entries(result.metafile.outputs)) {
  if (!metadata.entryPoint) continue;
  componentOutputBySource.set(resolve(repositoryDirectory, metadata.entryPoint), output);
}

const mapboxPatterns = [/(?:^|\/)node_modules\/mapbox-gl\//, /(?:^|\/)packages\/ui-mapbox\//];
const geocoderPatterns = [/(?:^|\/)node_modules\/@mapbox\/mapbox-gl-geocoder\//];
for (const name of ['autoload', 'loader', 'manifest']) {
  const inputs = graphInputs(result.metafile, entryOutputs[name]);
  assertDoesNotContain(inputs, [...mapboxPatterns, ...geocoderPatterns], `${name} startup graph`);
}
const uiDefinitions = definitions.filter(({ packageName }) => packageName === '@studiometa/ui');
for (const definition of uiDefinitions) {
  const output = componentOutputBySource.get(definition.sourcePath);
  if (!output) throw new Error(`Missing component output for ${definition.token}.`);
  assertDoesNotContain(
    graphInputs(result.metafile, output),
    [...mapboxPatterns, ...geocoderPatterns],
    `${definition.token} graph`,
  );
}
const nonGeocoderDefinitions = definitions.filter(({ token }) => token !== 'MapboxGeocoder');
for (const definition of nonGeocoderDefinitions) {
  const output = componentOutputBySource.get(definition.sourcePath);
  if (!output) throw new Error(`Missing component output for ${definition.token}.`);
  assertDoesNotContain(
    graphInputs(result.metafile, output),
    geocoderPatterns,
    `${definition.token} graph`,
  );
}
const actionDefinition = definitions.find(({ token }) => token === 'Action');
const actionOutput = actionDefinition && componentOutputBySource.get(actionDefinition.sourcePath);
if (!actionOutput) throw new Error('Missing Action output for unrelated-family isolation.');
assertDoesNotContain(
  graphInputs(result.metafile, actionOutput),
  [/(?:^|\/)packages\/ui\/Accordion\//],
  'Action graph',
);

const geocoderDefinition = definitions.find(({ token }) => token === 'MapboxGeocoder');
const geocoderOutput =
  geocoderDefinition && componentOutputBySource.get(geocoderDefinition.sourcePath);
if (!geocoderOutput) throw new Error('Missing MapboxGeocoder component output.');
const geocoderIntegrationOutputs = dynamicOutputEntries(result.metafile, geocoderOutput).filter(
  (output) =>
    graphInputs(result.metafile, output).some((input) =>
      geocoderPatterns.some((pattern) => pattern.test(toPosix(input))),
    ),
);
if (geocoderIntegrationOutputs.length !== 1) {
  throw new Error(
    `Expected exactly one lazy Mapbox geocoder integration graph, found ${geocoderIntegrationOutputs.length}.`,
  );
}
const geocoderDynamicOutput = geocoderIntegrationOutputs[0];

const toolkitIdentity = await assertSingleToolkitIdentity(result.metafile);
const initialFiles = (await listFiles(outputDirectory)).filter((file) => !file.endsWith('.json'));
await assertBrowserImports(result.metafile, outputDirectory, initialFiles);
for (const file of initialFiles.filter((path) => path.endsWith('.js'))) {
  if (!initialFiles.includes(`${file}.map`))
    throw new Error(`Missing public sourcemap for ${file}.`);
}
const sizes = await fileSizes(outputDirectory, initialFiles);
const observedBudgets = measureSizeBudgets(
  result.metafile,
  outputDirectory,
  entryOutputs,
  componentOutputBySource,
  definitions,
  geocoderDynamicOutput,
  sizes,
);
const verifiedSourceState = await sourceState();
if (JSON.stringify(verifiedSourceState) !== JSON.stringify(currentSourceState)) {
  throw new Error('Tracked build sources changed while the CDN build was running.');
}

const outputMetadata = Object.fromEntries(
  initialFiles.map((file) => [
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
const componentInventory = Object.fromEntries(
  definitions.map((definition) => {
    const output = componentOutputBySource.get(definition.sourcePath);
    if (!output) throw new Error(`Missing component entry chunk for ${definition.token}.`);
    const graph = staticOutputGraph(result.metafile, output).map((dependency) =>
      publicPath(outputDirectory, dependency),
    );
    const entry = publicPath(outputDirectory, output);
    const dynamicImports = dynamicOutputEntries(result.metafile, output).map((dynamicOutput) => {
      const dynamicEntry = publicPath(outputDirectory, dynamicOutput);
      return {
        entry: dynamicEntry,
        preload: staticOutputGraph(result.metafile, dynamicOutput)
          .map((dependency) => publicPath(outputDirectory, dependency))
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
const buildTime = reproducibleBuildTime();
const commit = runGit('rev-parse', 'HEAD');
const cleanBuildIdentifier = `${packageMetadata.version}+${commit}`;
const buildIdentifier = currentSourceState.clean
  ? cleanBuildIdentifier
  : `${cleanBuildIdentifier}.dirty.${currentSourceState.digest}`;
const entryMetadata = Object.fromEntries(
  Object.entries(entryOutputs).map(([name, output]) => {
    const path = publicPath(outputDirectory, output);
    return [
      name,
      {
        path,
        sourceMap: `${path}.map`,
        preload: staticOutputGraph(result.metafile, output)
          .map((dependency) => publicPath(outputDirectory, dependency))
          .filter((dependency) => dependency !== path)
          .sort(),
      },
    ];
  }),
);

const geocoderIntegrationEntry = publicPath(outputDirectory, geocoderDynamicOutput);

const buildMetadata = {
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
  package: { name: packageMetadata.name, version: packageMetadata.version },
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
      value: packageMetadata.version,
      suppliedBy: 'package-version',
      mutable: false,
    },
    main: {
      value: 'main',
      suppliedBy: 'future-deployment-alias',
      mutable: true,
    },
  },
  entries: entryMetadata,
  components: componentInventory,
  outputs: outputMetadata,
  styles: {
    'mapbox-gl': { path: 'styles/mapbox-gl.css', autoInject: false },
    'mapbox-geocoder': { path: 'styles/mapbox-gl-geocoder.css', autoInject: false },
  },
  licenses: {
    thirdPartyNotices: 'licenses/THIRD_PARTY_LICENSES.txt',
    esbuildLegalComments: 'eof',
    mapboxGl: {
      path: 'licenses/mapbox-gl-LICENSE.txt',
      authoritativeBundledNotice: true,
      note: "Mapbox GL's supplied LICENSE.txt is preserved verbatim and is the authoritative notice for its embedded third-party code; metafile package discovery does not expose those internals.",
    },
    mapboxGeocoder: {
      path: 'licenses/mapbox-gl-geocoder-LICENSE',
      authoritativeBundledNotice: true,
    },
  },
  releaseGates: {
    publicMapboxRedistributionReview: {
      required: true,
      status: 'required-not-recorded',
      blocksPublicRelease: true,
      reason:
        'Public redistribution of the bundled Mapbox GL code and geocoder must receive explicit legal review against the supplied licenses and current Mapbox terms.',
    },
  },
  integrations: {
    'mapbox-gl': {
      status: 'bundled-lazy',
      components: definitions
        .filter(({ packageName }) => packageName === '@studiometa/ui-mapbox')
        .map(({ token }) => token),
      worker: {
        mode: 'blob',
        cspRequirement: 'worker-src blob:',
        strictCspExternalWorkerShipped: false,
        browserVerificationRequired: true,
        note: 'The standard ESM bundle creates its worker from a blob URL. A strict-CSP external-worker build is not shipped, and browser verification is still required before release.',
      },
    },
    'mapbox-geocoder': {
      status: 'bundled-separately-lazy',
      components: ['MapboxGeocoder'],
      entry: geocoderIntegrationEntry,
      preload: staticOutputGraph(result.metafile, geocoderDynamicOutput)
        .map((dependency) => publicPath(outputDirectory, dependency))
        .filter((dependency) => dependency !== geocoderIntegrationEntry)
        .sort(),
    },
    'shopify-partial-rendering': {
      status: 'excluded-with-runtime-fallback',
      requestedSpecifier: '@shopify/partial-rendering',
      components: ['FetchShopifyPartial'],
      reason:
        'The optional preview adapter is absent from the lockfile and unavailable from the public npm registry; the CDN component diagnoses this and falls back to Fetch.',
    },
  },
  preload: {
    semantics:
      'Each preload list contains sorted transitive static ESM dependencies; order is not significant, and dynamic component and optional-integration edges are excluded.',
  },
  assertions: {
    jsToolkitIdentities: [toolkitIdentity],
    noBareImports: true,
    publicSourceMaps: true,
    startupMapboxIsolated: true,
    uiComponentsMapboxIsolated: uiDefinitions.map(({ token }) => token),
    nonGeocoderComponentsGeocoderIsolated: nonGeocoderDefinitions.map(({ token }) => token),
    unrelatedFamilyIsolated: {
      component: 'Action',
      excludedFamily: 'Accordion',
    },
    geocoderIntegrationGraphs: 1,
    sizeBudgets: observedBudgets,
  },
};

const integrityFiles = [...initialFiles, 'build.json'].sort();
let releaseSizeConverged = false;
for (let attempt = 0; attempt < 5; attempt += 1) {
  await writeJson(resolve(outputDirectory, 'build.json'), buildMetadata);
  const integrity = {
    schemaVersion: 1,
    algorithm: 'sha384',
    excludes: ['integrity.json'],
    files: Object.fromEntries(
      await Promise.all(
        integrityFiles.map(async (file) => [file, await sha384(resolve(outputDirectory, file))]),
      ),
    ),
  };
  await writeJson(resolve(outputDirectory, 'integrity.json'), integrity);
  const releaseFiles = [...integrityFiles, 'integrity.json'];
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

console.log(
  `Built ${definitions.length} components and ${initialFiles.length + 2} public files in ${toPosix(relative(repositoryDirectory, outputDirectory))}.`,
);
