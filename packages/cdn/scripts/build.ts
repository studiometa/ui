import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as tsdownBuild } from 'tsdown';
import type { Plugin } from 'rolldown';
import { catalog as uiCatalog } from '@studiometa/ui/catalog';
import { catalog as mapboxCatalog } from '@studiometa/ui-mapbox/catalog';

// Each component package owns and exports its own autoload catalog; the CDN build simply composes
// them in serving order (`@studiometa/ui` then `@studiometa/ui-mapbox`).
const componentCatalogs = [uiCatalog, mapboxCatalog] as const;

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const packageDirectory = resolve(scriptsDirectory, '..');
const repositoryDirectory = resolve(packageDirectory, '../..');
const defaultOutputDirectory = resolve(packageDirectory, 'dist');

// tsdown resolves both its `tsconfig` and its package.json-based dependency externalization from the
// process working directory. Pin it to the repository root so the build behaves identically whether
// it is launched from the repo root (as the tests do) or from `packages/cdn` (as `npm run build`
// does); every path in this script is absolute, so the working directory only steers tsdown. Left
// unpinned, a run from `packages/cdn` would externalize the workspace `@studiometa/ui*` packages
// (they are that manifest's dependencies) and resolve the narrower package tsconfig.
process.chdir(repositoryDirectory);
const packageMetadata = JSON.parse(
  await readFile(resolve(packageDirectory, 'package.json'), 'utf8'),
);
const jsToolkitMetadata = JSON.parse(
  await readFile(
    resolve(repositoryDirectory, 'node_modules/@studiometa/js-toolkit/package.json'),
    'utf8',
  ),
);
// Resolve tsdown from wherever npm installed it: it is a dependency of several
// workspace packages, so it may be hoisted to the repository root or kept under
// packages/cdn depending on the install layout.
const requireFromScript = createRequire(import.meta.url);
const tsdownMetadata = JSON.parse(
  await readFile(requireFromScript.resolve('tsdown/package.json'), 'utf8'),
);
const rolldownMetadata = JSON.parse(
  await readFile(resolve(repositoryDirectory, 'node_modules/rolldown/package.json'), 'utf8'),
);
const bundlerLabel = `tsdown@${tsdownMetadata.version} (rolldown@${rolldownMetadata.version})`;
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

// The declarations import js-toolkit types by their bare specifier so the ui `.d.ts` files resolve
// against the separately built js-toolkit declarations (served from its own versioned tree) instead
// of inlining them. Only the JavaScript rewrites js-toolkit to its absolute, origin-relative URL.
const declarationExternals = [
  '@studiometa/js-toolkit',
  '@studiometa/js-toolkit/utils',
  ...mapboxExternalSpecifiers,
] as const;

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
  'packages/ui-autoload',
  'packages/ui-mapbox',
] as const;

interface SizeBudgets {
  schemaVersion: number;
  bytes: Record<string, number>;
}

interface ComponentDefinition {
  token: string;
  packageName: string;
  subpath: string;
  exportName: string;
  strategy: string;
  group: string;
  children: readonly string[];
  styles: readonly string[];
  integrations: readonly string[];
  sourcePath: string;
}

// esbuild derived the release graph from its metafile. tsdown/rolldown expose the same information
// on each Rollup-style output chunk (`imports`/`dynamicImports`/`moduleIds`/`facadeModuleId`), so
// the build re-projects the chunk output into this minimal metafile shape and keeps every downstream
// graph helper (preload derivation, isolation assertions, third-party notices) unchanged. Output
// keys are tree-relative POSIX paths (e.g. `Action.js`, `chunks/Action-<hash>.js`) and input keys
// are repository-relative POSIX paths, matching what esbuild's metafile exposed to these helpers.
interface MetafileImport {
  path: string;
  kind: 'import-statement' | 'dynamic-import';
  external: boolean;
}
interface MetafileOutput {
  imports: MetafileImport[];
  inputs: Record<string, unknown>;
  entryPoint?: string;
  bytes: number;
}
interface Metafile {
  outputs: Record<string, MetafileOutput>;
  inputs: Record<string, unknown>;
}

// A minimal view of the rolldown output chunk this build relies on.
interface OutputChunkLike {
  type: 'chunk' | 'asset';
  fileName: string;
  isEntry: boolean;
  facadeModuleId: string | null;
  moduleIds: string[];
  imports: string[];
  dynamicImports: string[];
  code?: string;
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
    transform(source: string, id: string) {
      if (resolve(id.split('?')[0]) !== sourcePath) return undefined;
      const original = '    return import(this.__PARTIALS_MODULE);';
      if (!source.includes(original)) {
        throw new Error('The CDN Shopify fallback transform is stale.');
      }
      const replacement = [
        "    console.warn('[@studiometa/ui-cdn] Shopify partial rendering is unavailable in this CDN build; falling back to Fetch.');",
        "    throw new Error('The optional @shopify/partial-rendering adapter is excluded from this CDN build.');",
      ].join('\n');
      return { code: source.replace(original, replacement) };
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
    resolveId(id: string) {
      const path = mapping[id];
      if (!path) return undefined;
      return { id: path, external: true };
    },
  };
}

/**
 * Rewrites every dynamic `import('./<Component>.js')` of a @studiometa/ui-mapbox component module in
 * the ui tree — the calls the composed autoload's bundled `@studiometa/ui-mapbox/manifest` issues —
 * to the absolute, origin-relative URL of that component in the separately built ui-mapbox tree, and
 * marks it external. This keeps every ui-mapbox component source out of the ui tree entirely: the
 * composed manifest still discovers every Mapbox token up front, but each Mapbox component now
 * lazy-loads from `/ui-mapbox@<version>/<Component>.js` instead of from a chunk emitted into the ui
 * tree. It mirrors `externalizeToolkitPlugin`, resolving relative specifiers against their importer
 * so the ui-mapbox package's own `./<Component>.js` manifest imports are matched by absolute path.
 */
function externalizeUiMapboxPlugin(urlByModule: ReadonlyMap<string, string>): Plugin {
  return {
    name: 'cdn-externalize-ui-mapbox',
    resolveId(id: string, importer: string | undefined) {
      if (!importer || !id.startsWith('.')) return undefined;
      const resolved = resolve(dirname(importer.split('?')[0]), id);
      const url = urlByModule.get(resolved);
      return url ? { id: url, external: true } : undefined;
    },
  };
}

/**
 * Rewrites the ui-autoload tree's cross-package `@studiometa/ui/manifest` and
 * `@studiometa/ui-mapbox/manifest` specifiers to baked, absolute CDN URLs and marks them external,
 * mirroring `externalizeToolkitPlugin`. Neither component manifest is bundled into the ui-autoload
 * tree: each side-effect entry imports the SAME versioned manifest module already served from its own
 * tree, so the composed autoload reuses one manifest — and the lazily-loaded component chunks it
 * references — per package rather than re-bundling any component source. The baked version is the
 * lockstep `uiVersion`, the same version `externalizeUiMapboxPlugin` bakes into the ui tree, so the
 * manifest URLs pin consistently with the rest of the build.
 */
function externalizeUiAutoloadManifestsPlugin(mapping: Record<string, string>): Plugin {
  return {
    name: 'cdn-externalize-ui-autoload-manifests',
    resolveId(id: string) {
      const url = mapping[id];
      if (!url) return undefined;
      return { id: url, external: true };
    },
  };
}

// Rolldown reports every module id it bundles as an absolute path; keep only real, in-repository
// source files (dropping rolldown's virtual/runtime modules) and normalise them to the same
// repository-relative POSIX keys esbuild's metafile inputs used.
function toRepositoryInput(id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  const clean = id.split('?')[0];
  if (clean.includes('\0') || !isAbsolute(clean)) return undefined;
  const rel = toPosix(relative(repositoryDirectory, clean));
  return rel.startsWith('..') ? undefined : rel;
}

// Projects the rolldown output chunks into the minimal metafile the graph helpers consume. Static
// imports and dynamic imports keep their kind, and any import whose path is not itself an output
// chunk is an external browser import (a js-toolkit URL or a bare Mapbox specifier).
function metafileFromChunks(chunks: readonly OutputChunkLike[]): Metafile {
  const jsChunks = chunks.filter(
    (chunk) => chunk.type === 'chunk' && chunk.fileName.endsWith('.js'),
  );
  const outputKeys = new Set(jsChunks.map((chunk) => chunk.fileName));
  const outputs: Record<string, MetafileOutput> = {};
  const inputs: Record<string, unknown> = {};
  for (const chunk of jsChunks) {
    const chunkInputs: Record<string, unknown> = {};
    for (const moduleId of chunk.moduleIds) {
      const input = toRepositoryInput(moduleId);
      if (!input) continue;
      chunkInputs[input] = {};
      inputs[input] = {};
    }
    const imports: MetafileImport[] = [
      ...chunk.imports.map((path) => ({
        path,
        kind: 'import-statement' as const,
        external: !outputKeys.has(path),
      })),
      ...chunk.dynamicImports.map((path) => ({
        path,
        kind: 'dynamic-import' as const,
        external: !outputKeys.has(path),
      })),
    ];
    outputs[chunk.fileName] = {
      imports,
      inputs: chunkInputs,
      entryPoint: chunk.isEntry ? toRepositoryInput(chunk.facadeModuleId) : undefined,
      bytes: chunk.code?.length ?? 0,
    };
  }
  return { outputs, inputs };
}

// A rolldown import path already is the tree-relative output key, so no importer-relative resolution
// is needed; assert the referenced chunk actually exists.
function importedOutputKey(metafile: Metafile, importer: string, imported: string): string {
  if (metafile.outputs[imported]) return imported;
  throw new Error(`Missing imported output ${imported} from ${importer}`);
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

// Output keys are already tree-relative POSIX paths, so the public path is the key itself.
function publicPath(_outputDirectory: string, outputKey: string): string {
  return outputKey;
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
 * Asserts the ui tree's externalization invariants and returns the js-toolkit external URLs:
 *
 * - js-toolkit is imported only through its single absolute URL(s), and the main index URL — the
 *   module that owns the shared component registry — is present, with no js-toolkit source bundled.
 * - Mapbox GL and the optional geocoder source is bundled nowhere in the tree.
 * - No other external import is allowed.
 *
 * Rolldown surfaces static externals (the js-toolkit URLs) on the chunk graph but does not list a
 * bare *dynamic* external (Mapbox is loaded through `import('mapbox-gl')`) there, so the presence of
 * the Mapbox external specifiers is verified separately against the emitted code by
 * `assertMapboxDynamicExternals`.
 */
function assertUiExternals(
  metafile: Metafile,
  additionalAllowedUrls: readonly string[] = [],
): { toolkitUrls: string[] } {
  const external = collectExternalImports(metafile);
  const allowed = new Set<string>([
    jsToolkitIndexUrl,
    jsToolkitUtilsUrl,
    ...mapboxExternalSpecifiers,
    ...additionalAllowedUrls,
  ]);
  const disallowed = external.filter((url) => !allowed.has(url));
  if (disallowed.length > 0) {
    throw new Error(`The ui tree has unexpected external imports: ${disallowed.join(', ')}`);
  }
  if (!external.includes(jsToolkitIndexUrl)) {
    throw new Error(`The ui tree does not import the js-toolkit URL ${jsToolkitIndexUrl}.`);
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
  };
}

/**
 * Asserts the ui-autoload tree's externalization invariants: js-toolkit and both component manifests
 * are its only external imports, every required URL is present (so the externalization actually
 * fired), and no js-toolkit, ui or ui-mapbox source is bundled into the tree — only the generic
 * autoloader engine (from `packages/ui-autoload`) is.
 */
function assertUiAutoloadExternals(
  metafile: Metafile,
  requiredUrls: readonly string[],
  allowedUrls: readonly string[],
): void {
  const external = collectExternalImports(metafile);
  const allowed = new Set(allowedUrls);
  const disallowed = external.filter((url) => !allowed.has(url));
  if (disallowed.length > 0) {
    throw new Error(`The ui-autoload tree has unexpected external imports: ${disallowed.join(', ')}`);
  }
  const missing = requiredUrls.filter((url) => !external.includes(url));
  if (missing.length > 0) {
    throw new Error(`The ui-autoload tree is missing expected external import(s): ${missing.join(', ')}`);
  }
  const bundled = Object.keys(metafile.inputs).filter((input) =>
    ['node_modules/@studiometa/js-toolkit/', 'packages/ui/', 'packages/ui-mapbox/'].some((needle) =>
      toPosix(input).includes(needle),
    ),
  );
  if (bundled.length > 0) {
    throw new Error(
      `The ui-autoload tree bundled a cross-package dependency instead of externalizing it: ${bundled.join(', ')}`,
    );
  }
}

// Rolldown keeps a bare *dynamic* external as a runtime `import('<specifier>')` in the emitted code
// without recording it on the chunk graph, so the Mapbox externalization is asserted directly
// against the built modules: every Mapbox specifier must appear as a bare dynamic import, resolved
// by the consumer's import map. Returns the specifiers actually found, in sorted order.
async function assertMapboxDynamicExternals(
  outputDirectory: string,
  files: readonly string[],
): Promise<string[]> {
  const pattern = /\bimport\(\s*[`'"]([^`'"]+)[`'"]\s*\)/g;
  const found = new Set<string>();
  for (const file of files.filter((path) => path.endsWith('.js'))) {
    const source = await readFile(resolve(outputDirectory, file), 'utf8');
    for (const match of source.matchAll(pattern)) {
      if ((mapboxExternalSpecifiers as readonly string[]).includes(match[1])) found.add(match[1]);
    }
  }
  const missing = mapboxExternalSpecifiers.filter((specifier) => !found.has(specifier));
  if (missing.length > 0) {
    throw new Error(
      `The ui tree does not import Mapbox through the external specifier ${missing.join(', ')}.`,
    );
  }
  return [...found].sort();
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

// Rolldown emits no source map for a pure re-export facade entry (`export { X as Action } …`), the
// same shape esbuild emitted with an empty (`sources: []`) map. Synthesize that empty, source-free
// map for every such `.js` so the public "one source map per module" invariant still holds and the
// facade stays sourcemap-linked.
async function synthesizeFacadeSourceMaps(treeDirectory: string): Promise<void> {
  const files = await listFiles(treeDirectory);
  const present = new Set(files);
  for (const file of files) {
    if (!file.endsWith('.js') || present.has(`${file}.map`)) continue;
    const absolute = resolve(treeDirectory, file);
    const base = file.split('/').pop() as string;
    const map = {
      version: 3,
      file: base,
      sources: [],
      sourcesContent: [],
      names: [],
      mappings: '',
    };
    await writeFile(`${absolute}.map`, `${JSON.stringify(map)}\n`);
    let source = await readFile(absolute, 'utf8');
    if (!source.includes('# sourceMappingURL=')) {
      source = `${source.replace(/\s+$/, '')}\n//# sourceMappingURL=${base}.map\n`;
      await writeFile(absolute, source);
    }
  }
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

  const dynamicLiteralPattern = /\bimport\(\s*[`'"]([^`'"]+)[`'"]\s*\)/g;
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

// Shared tsdown/rolldown options for a bundled JavaScript tree. Splitting is automatic with several
// entry points; entries stay at stable, non-hashed `<name>.js` paths and shared code is content
// hashed under `chunks/`. Source maps embed `sourcesContent`, and the build is reproducible.
function sharedBundleOptions(outputDirectory: string) {
  return {
    format: 'esm' as const,
    platform: 'browser' as const,
    target: 'es2020',
    outDir: outputDirectory,
    clean: false,
    write: true,
    sourcemap: true,
    minify: true,
    treeshake: true,
    dts: false as const,
    config: false,
    logLevel: 'silent' as const,
    define: { __DEV__: 'false' },
    // Keep origin-relative external URLs (js-toolkit's `/js-toolkit@<v>/…` and the composed
    // manifest's `/ui-mapbox@<v>/…` dynamic imports) verbatim. Rolldown otherwise rewrites an
    // absolute external into a chunk-relative `../../…` path, which a browser cannot resolve back to
    // the intended versioned CDN URL — breaking the composed autoload's cross-tree lazy imports.
    inputOptions: { makeAbsoluteExternalsRelative: false as const },
    outputOptions: {
      entryFileNames: '[name].js',
      chunkFileNames: 'chunks/[name]-[hash].js',
      sourcemapExcludeSources: false,
    },
  };
}

// Shared tsdown options for a declarations-only pass. `eager` resolves the barrel's transitive
// re-exports so `index.d.ts` re-exports every component, and `emitDtsOnly` leaves the JavaScript
// pass to own the `.js`/`.map` outputs. Declaration entries stay at `<name>.d.ts` and shared
// declaration chunks are hashed under `chunks/`.
//
// The `tsconfig` is pinned to the repository root config by absolute path so the eager tsc program
// compiles the same bounded set of files regardless of the process working directory. Left to
// discovery, a run from `packages/cdn` would pick up that package's narrower `tsconfig.json` (which
// does not include the ui/ui-mapbox sources) and pull in an unbounded file set, exhausting memory.
const declarationTsconfig = resolve(repositoryDirectory, 'tsconfig.json');
function sharedDeclarationOptions(outputDirectory: string, external: readonly string[]) {
  return {
    format: 'esm' as const,
    platform: 'browser' as const,
    target: 'es2020',
    outDir: outputDirectory,
    clean: false,
    write: true,
    sourcemap: false,
    tsconfig: declarationTsconfig,
    dts: { eager: true, emitDtsOnly: true, tsconfig: declarationTsconfig },
    config: false,
    logLevel: 'silent' as const,
    external: [...external],
    outputOptions: {
      entryFileNames: '[name].js',
      chunkFileNames: 'chunks/[name]-[hash].js',
    },
  };
}

function chunksOf(results: Awaited<ReturnType<typeof tsdownBuild>>): OutputChunkLike[] {
  const chunks: OutputChunkLike[] = [];
  for (const result of results as unknown as Array<{ chunks?: OutputChunkLike[] }>) {
    for (const chunk of result.chunks ?? []) chunks.push(chunk);
  }
  return chunks;
}

const { outputDirectory, allowDirty } = parseBuildOptions();
// The ui-mapbox tree is versioned in lockstep with ui: it always carries the same version as ui, so
// it reuses `uiVersion` rather than reading @studiometa/ui-mapbox's own package version separately.
const uiTreePrefix = `releases/ui/${uiVersion}`;
const uiMapboxTreePrefix = `releases/ui-mapbox/${uiVersion}`;
const jsToolkitTreePrefix = `releases/js-toolkit/${jsToolkitVersion}`;
const uiOutputDirectory = resolve(outputDirectory, uiTreePrefix);
const uiMapboxOutputDirectory = resolve(outputDirectory, uiMapboxTreePrefix);
const jsToolkitOutputDirectory = resolve(outputDirectory, jsToolkitTreePrefix);
const UI_MAPBOX_BUILD_NAME = '@studiometa/ui-cdn-mapbox';
const uiMapboxComponentUrl = (subpath: string): string => `/ui-mapbox@${uiVersion}/${subpath}.js`;
// The ui-autoload tree is also versioned in lockstep with ui, so it reuses `uiVersion` for both its
// own prefix and the cross-tree manifest URLs it bakes.
const uiAutoloadTreePrefix = `releases/ui-autoload/${uiVersion}`;
const uiAutoloadOutputDirectory = resolve(outputDirectory, uiAutoloadTreePrefix);
const UI_AUTOLOAD_BUILD_NAME = '@studiometa/ui-cdn-autoload';
// The composed autoload reuses each package's manifest from that package's own versioned tree rather
// than re-bundling it. These are baked as origin-relative absolute paths (leading `/`, no host),
// exactly like the js-toolkit URL and the `/ui-mapbox@<uiVersion>/…` cross-tree imports
// `externalizeUiMapboxPlugin` bakes — so every channel (releases and PR previews alike) resolves the
// manifest same-origin and stays host-portable. The version is the lockstep `uiVersion`.
const uiManifestCdnUrl = `/ui@${uiVersion}/manifest.js`;
const uiMapboxManifestCdnUrl = `/ui-mapbox@${uiVersion}/manifest.js`;

const currentSourceState = await sourceState();
if (!currentSourceState.clean && !allowDirty) {
  throw new Error(
    `Refusing a release-style CDN build with tracked build sources changed: ${currentSourceState.dirtyFiles.join(', ')}. Commit or restore these files, or pass --allow-dirty for explicitly non-publishable local output.`,
  );
}
const definitions = await componentDefinitions();
const uiDefinitions = definitions.filter(({ packageName }) => packageName === '@studiometa/ui');
const mapboxDefinitions = definitions.filter(
  ({ packageName }) => packageName === '@studiometa/ui-mapbox',
);
await rm(outputDirectory, { recursive: true, force: true });
await mkdir(uiOutputDirectory, { recursive: true });
await mkdir(uiMapboxOutputDirectory, { recursive: true });
await mkdir(uiAutoloadOutputDirectory, { recursive: true });
await mkdir(jsToolkitOutputDirectory, { recursive: true });

const buildTime = reproducibleBuildTime();
const commit = runGit('rev-parse', 'HEAD');
const cleanBuildIdentifier = `${uiVersion}+${commit}`;
const buildIdentifier = currentSourceState.clean
  ? cleanBuildIdentifier
  : `${cleanBuildIdentifier}.dirty.${currentSourceState.digest}`;

const jsToolkitEntryPoints = {
  index: resolve(repositoryDirectory, 'packages/cdn/src/barrel-js-toolkit.ts'),
  'utils/index': resolve(repositoryDirectory, 'packages/cdn/src/barrel-js-toolkit-utils.ts'),
};

// Pass A — the versioned js-toolkit artifact. It is bundled fully (no externals) so its own
// internal chunks resolve relatively within its tree, and the ui tree can import it by URL. Its
// declarations bundle js-toolkit's own types into `index.d.ts` and `utils/index.d.ts`.
const jsToolkitResults = await tsdownBuild({
  ...sharedBundleOptions(jsToolkitOutputDirectory),
  entry: jsToolkitEntryPoints,
});
await tsdownBuild({
  ...sharedDeclarationOptions(jsToolkitOutputDirectory, []),
  entry: jsToolkitEntryPoints,
});
const jsToolkitMetafile = metafileFromChunks(chunksOf(jsToolkitResults));

// Every component is emitted as a stable, non-hashed ESM entry named `<subpath>.js` at its own
// package tree root, so a consumer can import a single component by a path that mirrors the npm
// subpath export (`@studiometa/ui` → `/ui@<ref>/Action.js`, `@studiometa/ui-mapbox` →
// `/ui-mapbox@<ref>/MapboxMap.js`). Pointing an entry straight at the component source module
// re-exports its public exports. js-toolkit gets no per-symbol files (pass A keeps only index.js +
// utils/index.js). Subpaths must not collide with a tree's reserved entries and no two components
// in the same tree may share a subpath.
function componentEntryPointsFor(
  componentDefinitions: readonly ComponentDefinition[],
  reservedEntryNames: ReadonlySet<string>,
  treeLabel: string,
): Record<string, string> {
  const entryPoints: Record<string, string> = {};
  for (const definition of componentDefinitions) {
    const entryName = definition.subpath;
    if (reservedEntryNames.has(entryName)) {
      throw new Error(
        `Component subpath "${entryName}" collides with a reserved ${treeLabel} entry name.`,
      );
    }
    const existing = entryPoints[entryName];
    if (existing && existing !== definition.sourcePath) {
      throw new Error(`Two ${treeLabel} components share the CDN subpath "${entryName}".`);
    }
    entryPoints[entryName] = definition.sourcePath;
  }
  return entryPoints;
}

const reservedUiEntryNames = new Set(['autoload', 'loader', 'manifest', 'index']);
const componentEntryPoints = componentEntryPointsFor(uiDefinitions, reservedUiEntryNames, 'ui');

// The composed autoload's bundled `@studiometa/ui-mapbox/manifest` lazy-imports each Mapbox
// component by its `./<Component>.js` module; map each of those source modules to the ui-mapbox tree
// URL so the ui build externalizes them there instead of bundling them into the ui tree.
const uiMapboxUrlByModule = new Map<string, string>();
const uiMapboxExternalUrls: string[] = [];
for (const definition of mapboxDefinitions) {
  const url = uiMapboxComponentUrl(definition.subpath);
  uiMapboxUrlByModule.set(definition.sourcePath.replace(/\.ts$/, '.js'), url);
  uiMapboxExternalUrls.push(url);
}
uiMapboxExternalUrls.sort();

const uiEntryPoints = {
  autoload: resolve(repositoryDirectory, 'packages/cdn/src/autoload.ts'),
  loader: resolve(repositoryDirectory, 'packages/cdn/src/loader.ts'),
  manifest: resolve(repositoryDirectory, 'packages/cdn/src/manifest.ts'),
  index: resolve(repositoryDirectory, 'packages/cdn/src/barrel-ui.ts'),
  ...componentEntryPoints,
};

// Pass B — the @studiometa/ui tree. js-toolkit is rewritten to its external, versioned URL and the
// ui barrel is emitted as index.js. Autoload, loader, manifest, every stable component entry and
// the barrel now import the single external js-toolkit URL and carry no js-toolkit source. The
// declarations pass keeps js-toolkit external as a bare specifier so the ui `.d.ts` files resolve
// against the js-toolkit declarations tree rather than inlining its types.
const uiResults = await tsdownBuild({
  ...sharedBundleOptions(uiOutputDirectory),
  entry: uiEntryPoints,
  external: [...mapboxExternalSpecifiers],
  plugins: [
    shopifyFallbackPlugin(),
    externalizeToolkitPlugin(),
    externalizeUiMapboxPlugin(uiMapboxUrlByModule),
  ],
});
await tsdownBuild({
  ...sharedDeclarationOptions(uiOutputDirectory, declarationExternals),
  entry: uiEntryPoints,
});
const uiMetafile = metafileFromChunks(chunksOf(uiResults));

// Pass C — the @studiometa/ui-mapbox tree, versioned in lockstep with ui. Every Mapbox component is
// emitted as a stable `<subpath>.js` entry (plus the barrel `index.js`) at the ui-mapbox tree root.
// js-toolkit is rewritten to the same external, versioned URL the ui tree uses (so both trees share
// one runtime instance and one component registry), and mapbox-gl and the geocoder stay external
// bare specifiers resolved by the consumer's import map. @studiometa/ui-mapbox has no
// @studiometa/ui dependency, so nothing ui-related is bundled or externalized here.
const reservedUiMapboxEntryNames = new Set(['index']);
const uiMapboxComponentEntryPoints = componentEntryPointsFor(
  mapboxDefinitions,
  reservedUiMapboxEntryNames,
  'ui-mapbox',
);
const uiMapboxEntryPoints = {
  index: resolve(repositoryDirectory, 'packages/cdn/src/barrel-ui-mapbox.ts'),
  ...uiMapboxComponentEntryPoints,
};
const uiMapboxResults = await tsdownBuild({
  ...sharedBundleOptions(uiMapboxOutputDirectory),
  entry: uiMapboxEntryPoints,
  external: [...mapboxExternalSpecifiers],
  plugins: [externalizeToolkitPlugin()],
});
await tsdownBuild({
  ...sharedDeclarationOptions(uiMapboxOutputDirectory, declarationExternals),
  entry: uiMapboxEntryPoints,
});
const uiMapboxMetafile = metafileFromChunks(chunksOf(uiMapboxResults));

// Pass D — the @studiometa/ui-autoload tree, versioned in lockstep with ui. It bundles the generic
// autoloader engine (loader, autoload, runtime, types) and emits three stable entries: the pure
// `index.js` barrel plus the two side-effect entries `ui.js` and `ui-mapbox.js`. js-toolkit is
// rewritten to the same external, versioned URL every other tree uses (so all trees share one runtime
// instance and one component registry), and the `@studiometa/ui` and `@studiometa/ui-mapbox` component
// manifests are externalized to their own trees' `/…/manifest.js` URLs — no component source, and no
// manifest, is re-bundled here. The engine and `runtime.ts` are bundled INTO the tree.
const uiAutoloadEntryPoints = {
  index: resolve(repositoryDirectory, 'packages/ui-autoload/index.ts'),
  ui: resolve(repositoryDirectory, 'packages/ui-autoload/ui.ts'),
  'ui-mapbox': resolve(repositoryDirectory, 'packages/ui-autoload/ui-mapbox.ts'),
};
const uiAutoloadManifestMapping: Record<string, string> = {
  '@studiometa/ui/manifest': uiManifestCdnUrl,
  '@studiometa/ui-mapbox/manifest': uiMapboxManifestCdnUrl,
};
const uiAutoloadResults = await tsdownBuild({
  ...sharedBundleOptions(uiAutoloadOutputDirectory),
  entry: uiAutoloadEntryPoints,
  plugins: [
    externalizeToolkitPlugin(),
    externalizeUiAutoloadManifestsPlugin(uiAutoloadManifestMapping),
  ],
});
await tsdownBuild({
  ...sharedDeclarationOptions(uiAutoloadOutputDirectory, [
    '@studiometa/js-toolkit',
    '@studiometa/js-toolkit/utils',
    '@studiometa/ui/manifest',
    '@studiometa/ui-mapbox/manifest',
  ]),
  entry: uiAutoloadEntryPoints,
});
const uiAutoloadMetafile = metafileFromChunks(chunksOf(uiAutoloadResults));

// Re-export facade entries carry no source map from rolldown; synthesize the empty maps so the
// public source-map invariant holds across every tree.
await synthesizeFacadeSourceMaps(jsToolkitOutputDirectory);
await synthesizeFacadeSourceMaps(uiOutputDirectory);
await synthesizeFacadeSourceMaps(uiMapboxOutputDirectory);
await synthesizeFacadeSourceMaps(uiAutoloadOutputDirectory);

// Mapbox GL and the geocoder are external (import-map resolved) and no longer bundled, so the CDN
// serves neither their JavaScript, their stylesheets nor their license notices — consumers load
// those from the same source they point their import map at.
await writeThirdPartyNotices(uiMetafile, uiOutputDirectory);
await writeThirdPartyNotices(uiMapboxMetafile, uiMapboxOutputDirectory);
await writeThirdPartyNotices(uiAutoloadMetafile, uiAutoloadOutputDirectory);
await writeThirdPartyNotices(jsToolkitMetafile, jsToolkitOutputDirectory);

const uiEntryNames = ['autoload', 'loader', 'manifest', 'index'];
const entryOutputs = Object.fromEntries(
  uiEntryNames.map((name) => {
    const key = `${name}.js`;
    if (!uiMetafile.outputs[key]) throw new Error(`Missing ui entry output ${key}.`);
    return [name, key];
  }),
);
const componentOutputBySource = new Map<string, string>();
for (const [output, metadata] of Object.entries(uiMetafile.outputs)) {
  if (!metadata.entryPoint) continue;
  componentOutputBySource.set(resolve(repositoryDirectory, metadata.entryPoint), output);
}

// The Mapbox component family stays lazy, and the Mapbox libraries are external (import-map
// resolved), so neither the component source nor the libraries may appear in the startup graph or
// in any @studiometa/ui component graph. That the library source is bundled nowhere at all is
// enforced globally by `assertUiExternals`. The `@studiometa/ui-mapbox/manifest` metadata module is
// intentionally exempt: it is a plain map of lazy `() => import()` thunks (no component nor library
// source of its own) and the composed manifest statically imports it so the loader can discover
// every token up front while still loading each Mapbox component on demand.
const uiMapboxSourcePattern = /(?:^|\/)packages\/ui-mapbox\/(?!manifest\.ts(?:$|[?#]))/;
const mapboxLibPatterns = [
  /(?:^|\/)node_modules\/mapbox-gl\//,
  /(?:^|\/)node_modules\/@mapbox\/mapbox-gl-geocoder\//,
];
const mapboxIsolationPatterns = [uiMapboxSourcePattern, ...mapboxLibPatterns];
for (const name of uiEntryNames) {
  const inputs = graphInputs(uiMetafile, entryOutputs[name]);
  assertDoesNotContain(inputs, mapboxIsolationPatterns, `${name} startup graph`);
}
for (const definition of uiDefinitions) {
  const output = componentOutputBySource.get(definition.sourcePath);
  if (!output) throw new Error(`Missing component output for ${definition.token}.`);
  assertDoesNotContain(
    graphInputs(uiMetafile, output),
    mapboxIsolationPatterns,
    `${definition.token} graph`,
  );
}
const actionDefinition = definitions.find(({ token }) => token === 'Action');
const actionOutput = actionDefinition && componentOutputBySource.get(actionDefinition.sourcePath);
if (!actionOutput) throw new Error('Missing Action output for unrelated-family isolation.');
assertDoesNotContain(
  graphInputs(uiMetafile, actionOutput),
  [/(?:^|\/)packages\/ui\/Accordion\//],
  'Action graph',
);

// The ui tree externalizes js-toolkit and the ui-mapbox component URLs; Mapbox GL and the geocoder
// no longer appear in the ui tree at all (their components moved to the ui-mapbox tree), so the ui
// tree's only allowed externals are the js-toolkit URLs and the `/ui-mapbox@<version>/*.js` URLs.
const { toolkitUrls: toolkitExternalUrls } = assertUiExternals(uiMetafile, uiMapboxExternalUrls);
const toolkitIdentity = `@studiometa/js-toolkit@${jsToolkitVersion}`;

const uiInitialFiles = (await listFiles(uiOutputDirectory)).filter(
  (file) => !file.endsWith('.json'),
);
await assertBrowserImports(
  uiMetafile,
  uiOutputDirectory,
  uiInitialFiles,
  new Set([...toolkitExternalUrls, ...uiMapboxExternalUrls]),
);
for (const file of uiInitialFiles.filter((path) => path.endsWith('.js'))) {
  if (!uiInitialFiles.includes(`${file}.map`))
    throw new Error(`Missing public sourcemap for ${file}.`);
}
const uiSizes = await fileSizes(uiOutputDirectory, uiInitialFiles);

// The ui-mapbox tree owns the Mapbox component source. Like the ui tree it externalizes js-toolkit
// (asserted by the shared `assertUiExternals`) and keeps mapbox-gl and the geocoder as external bare
// dynamic imports (verified against the emitted code by `assertMapboxDynamicExternals`).
const { toolkitUrls: uiMapboxToolkitExternalUrls } = assertUiExternals(uiMapboxMetafile);
const uiMapboxInitialFiles = (await listFiles(uiMapboxOutputDirectory)).filter(
  (file) => !file.endsWith('.json'),
);
const mapboxExternalSpecifiersFound = await assertMapboxDynamicExternals(
  uiMapboxOutputDirectory,
  uiMapboxInitialFiles,
);
await assertBrowserImports(
  uiMapboxMetafile,
  uiMapboxOutputDirectory,
  uiMapboxInitialFiles,
  new Set([...uiMapboxToolkitExternalUrls, ...mapboxExternalSpecifiersFound]),
);
for (const file of uiMapboxInitialFiles.filter((path) => path.endsWith('.js'))) {
  if (!uiMapboxInitialFiles.includes(`${file}.map`))
    throw new Error(`Missing public sourcemap for ${file}.`);
}
const uiMapboxSizes = await fileSizes(uiMapboxOutputDirectory, uiMapboxInitialFiles);
const uiMapboxComponentOutputBySource = new Map<string, string>();
for (const [output, metadata] of Object.entries(uiMapboxMetafile.outputs)) {
  if (!metadata.entryPoint) continue;
  uiMapboxComponentOutputBySource.set(resolve(repositoryDirectory, metadata.entryPoint), output);
}
const uiMapboxEntryOutputs = { index: 'index.js' };
if (!uiMapboxMetafile.outputs['index.js']) {
  throw new Error('Missing ui-mapbox entry output index.js.');
}

// The ui-autoload tree externalizes js-toolkit and both component manifests; nothing else may be an
// external import, both manifests and the js-toolkit URL must be present, and no js-toolkit/ui/
// ui-mapbox source may be bundled into it.
const uiAutoloadRequiredUrls = [jsToolkitIndexUrl, uiManifestCdnUrl, uiMapboxManifestCdnUrl];
const uiAutoloadAllowedUrls = [
  jsToolkitIndexUrl,
  jsToolkitUtilsUrl,
  uiManifestCdnUrl,
  uiMapboxManifestCdnUrl,
];
assertUiAutoloadExternals(uiAutoloadMetafile, uiAutoloadRequiredUrls, uiAutoloadAllowedUrls);
const uiAutoloadInitialFiles = (await listFiles(uiAutoloadOutputDirectory)).filter(
  (file) => !file.endsWith('.json'),
);
await assertBrowserImports(
  uiAutoloadMetafile,
  uiAutoloadOutputDirectory,
  uiAutoloadInitialFiles,
  new Set(uiAutoloadAllowedUrls),
);
for (const file of uiAutoloadInitialFiles.filter((path) => path.endsWith('.js'))) {
  if (!uiAutoloadInitialFiles.includes(`${file}.map`))
    throw new Error(`Missing public sourcemap for ${file}.`);
}
const uiAutoloadSizes = await fileSizes(uiAutoloadOutputDirectory, uiAutoloadInitialFiles);
const uiAutoloadEntryOutputs = { index: 'index.js', ui: 'ui.js', 'ui-mapbox': 'ui-mapbox.js' };
for (const [name, file] of Object.entries(uiAutoloadEntryOutputs)) {
  if (!uiAutoloadMetafile.outputs[file]) {
    throw new Error(`Missing ui-autoload entry output ${file} for ${name}.`);
  }
}

const jsToolkitEntryOutputs = Object.fromEntries(
  (
    [
      ['index', 'index.js'],
      ['utils', 'utils/index.js'],
    ] as const
  ).map(([name, file]) => {
    if (!jsToolkitMetafile.outputs[file])
      throw new Error(`Missing js-toolkit entry output ${file}.`);
    return [name, file];
  }),
);
for (const name of Object.keys(jsToolkitEntryOutputs)) {
  assertDoesNotContain(
    graphInputs(jsToolkitMetafile, jsToolkitEntryOutputs[name]),
    mapboxIsolationPatterns,
    `js-toolkit ${name} graph`,
  );
}
const jsToolkitInitialFiles = (await listFiles(jsToolkitOutputDirectory)).filter(
  (file) => !file.endsWith('.json'),
);
await assertBrowserImports(
  jsToolkitMetafile,
  jsToolkitOutputDirectory,
  jsToolkitInitialFiles,
  new Set(),
);
for (const file of jsToolkitInitialFiles.filter((path) => path.endsWith('.js'))) {
  if (!jsToolkitInitialFiles.includes(`${file}.map`))
    throw new Error(`Missing public sourcemap for ${file}.`);
}
const jsToolkitSizes = await fileSizes(jsToolkitOutputDirectory, jsToolkitInitialFiles);

function declarationBytes(sizes: Record<string, number>): number {
  return Object.entries(sizes)
    .filter(([file]) => file.endsWith('.d.ts'))
    .reduce((total, [, bytes]) => total + bytes, 0);
}

const observedBudgets: Record<string, number> = {
  ...measureUiSizeBudgets(
    uiMetafile,
    uiOutputDirectory,
    entryOutputs,
    componentOutputBySource,
    definitions,
    uiSizes,
  ),
  ...measureJsToolkitSizeBudgets(
    jsToolkitMetafile,
    jsToolkitOutputDirectory,
    jsToolkitEntryOutputs,
    jsToolkitSizes,
  ),
};
// The declaration budgets mirror the JavaScript per-entry style: a per-barrel ceiling for each of
// the three importable roots (the ui barrel and the two js-toolkit entries) plus a total across
// every emitted `.d.ts` (entries and shared declaration chunks) in both trees.
observedBudgets['dts:entry:index'] = uiSizes['index.d.ts'];
observedBudgets['dts:js-toolkit:entry:index'] = jsToolkitSizes['index.d.ts'];
observedBudgets['dts:js-toolkit:entry:utils'] = jsToolkitSizes['utils/index.d.ts'];
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
observedBudgets['total:declarations'] = Object.entries(distSizesBeforeMetadata)
  .filter(([file]) => file.endsWith('.d.ts'))
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
        type: file.endsWith('.d.ts')
          ? 'declaration'
          : file.endsWith('.map')
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

function componentInventoryFor(
  componentDefinitions: readonly ComponentDefinition[],
  metafile: Metafile,
  treeOutputDirectory: string,
  outputBySource: ReadonlyMap<string, string>,
): Record<string, unknown> {
  return Object.fromEntries(
    componentDefinitions.map((definition) => {
      const output = outputBySource.get(definition.sourcePath);
      if (!output) throw new Error(`Missing component entry chunk for ${definition.token}.`);
      const graph = staticOutputGraph(metafile, output).map((dependency) =>
        publicPath(treeOutputDirectory, dependency),
      );
      const entry = publicPath(treeOutputDirectory, output);
      const dynamicImports = dynamicOutputEntries(metafile, output).map((dynamicOutput) => {
        const dynamicEntry = publicPath(treeOutputDirectory, dynamicOutput);
        return {
          entry: dynamicEntry,
          preload: staticOutputGraph(metafile, dynamicOutput)
            .map((dependency) => publicPath(treeOutputDirectory, dependency))
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
}

// The ui and ui-mapbox component inventories are each computed against their own tree: ui component
// entries live under `/ui@<v>/…` and Mapbox component entries under `/ui-mapbox@<v>/…`.
const componentInventory = componentInventoryFor(
  uiDefinitions,
  uiMetafile,
  uiOutputDirectory,
  componentOutputBySource,
);
const uiMapboxComponentInventory = componentInventoryFor(
  mapboxDefinitions,
  uiMapboxMetafile,
  uiMapboxOutputDirectory,
  uiMapboxComponentOutputBySource,
);

const mapboxComponents = mapboxDefinitions.map(({ token }) => token);

const uiBuildMetadata = {
  schemaVersion: 1,
  format: {
    name: 'studiometa-browser-cdn',
    version: 1,
    module: 'esm',
    target: 'es2020',
    splitting: true,
    sourcemaps: true,
    declarations: true,
    bundler: bundlerLabel,
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
  entries: entryMetadataFor(uiMetafile, uiOutputDirectory, entryOutputs),
  components: componentInventory,
  outputs: outputMetadataFor(uiInitialFiles, uiSizes),
  // The CDN serves no stylesheets: Mapbox GL and the geocoder — the only components that needed
  // one — are external, so consumers load their CSS from the source their import map points at.
  styles: {},
  licenses: {
    thirdPartyNotices: 'licenses/THIRD_PARTY_LICENSES.txt',
    legalComments: 'none',
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
  declarations: {
    semantics:
      'Every importable entry emits a bundled `.d.ts` alongside its `.js`, sharing hashed declaration chunks under `chunks/`. The ui declarations import `@studiometa/js-toolkit` externally so they resolve against the js-toolkit declarations tree instead of inlining its types.',
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
    declarations: true,
    bundler: bundlerLabel,
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
  entries: entryMetadataFor(jsToolkitMetafile, jsToolkitOutputDirectory, jsToolkitEntryOutputs),
  components: {},
  outputs: outputMetadataFor(jsToolkitInitialFiles, jsToolkitSizes),
  licenses: {
    thirdPartyNotices: 'licenses/THIRD_PARTY_LICENSES.txt',
    legalComments: 'none',
  },
};

const uiMapboxBuildMetadata = {
  schemaVersion: 1,
  format: {
    name: 'studiometa-browser-cdn-mapbox',
    version: 1,
    module: 'esm',
    target: 'es2020',
    splitting: true,
    sourcemaps: true,
    declarations: true,
    bundler: bundlerLabel,
  },
  // The ui-mapbox tree is versioned in lockstep with ui, so it reports the ui version.
  package: { name: UI_MAPBOX_BUILD_NAME, version: uiVersion },
  dependencies: { '@studiometa/js-toolkit': jsToolkitVersion },
  build: {
    commit,
    identifier: `${UI_MAPBOX_BUILD_NAME}@${uiVersion}+${commit}`,
    clean: currentSourceState.clean,
    publishable: currentSourceState.clean,
    createdAt: buildTime.iso,
    sourceDateEpoch: buildTime.epoch,
    timeSource: buildTime.source,
  },
  entries: entryMetadataFor(uiMapboxMetafile, uiMapboxOutputDirectory, uiMapboxEntryOutputs),
  components: uiMapboxComponentInventory,
  outputs: outputMetadataFor(uiMapboxInitialFiles, uiMapboxSizes),
  styles: {},
  licenses: {
    thirdPartyNotices: 'licenses/THIRD_PARTY_LICENSES.txt',
    legalComments: 'none',
  },
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
    'js-toolkit': {
      status: 'external-versioned-artifact',
      version: jsToolkitVersion,
      urls: uiMapboxToolkitExternalUrls,
      release: jsToolkitTreePrefix,
      note: 'js-toolkit is built as its own versioned artifact and imported by an absolute, origin-relative URL so every ui-mapbox output shares one runtime instance with the ui tree.',
    },
  },
  assertions: {
    jsToolkitIdentities: [toolkitIdentity],
    jsToolkitExternalUrls: uiMapboxToolkitExternalUrls,
    treeBundlesToolkit: false,
    mapboxExternalSpecifiers: mapboxExternalSpecifiersFound,
    treeBundlesMapbox: false,
    onlyAllowedBareExternals: true,
    publicSourceMaps: true,
  },
};

const uiAutoloadBuildMetadata = {
  schemaVersion: 1,
  format: {
    name: 'studiometa-browser-cdn-autoload',
    version: 1,
    module: 'esm',
    target: 'es2020',
    splitting: true,
    sourcemaps: true,
    declarations: true,
    bundler: bundlerLabel,
  },
  // The ui-autoload tree is versioned in lockstep with ui, so it reports the ui version.
  package: { name: UI_AUTOLOAD_BUILD_NAME, version: uiVersion },
  dependencies: { '@studiometa/js-toolkit': jsToolkitVersion },
  build: {
    commit,
    identifier: `${UI_AUTOLOAD_BUILD_NAME}@${uiVersion}+${commit}`,
    clean: currentSourceState.clean,
    publishable: currentSourceState.clean,
    createdAt: buildTime.iso,
    sourceDateEpoch: buildTime.epoch,
    timeSource: buildTime.source,
  },
  entries: entryMetadataFor(uiAutoloadMetafile, uiAutoloadOutputDirectory, uiAutoloadEntryOutputs),
  // The ui-autoload tree serves the generic engine and side-effect entries only; it declares no
  // components of its own (each component still lives in its package's own tree).
  components: {},
  outputs: outputMetadataFor(uiAutoloadInitialFiles, uiAutoloadSizes),
  licenses: {
    thirdPartyNotices: 'licenses/THIRD_PARTY_LICENSES.txt',
    legalComments: 'none',
  },
  integrations: {
    'js-toolkit': {
      status: 'external-versioned-artifact',
      version: jsToolkitVersion,
      urls: [jsToolkitIndexUrl],
      release: jsToolkitTreePrefix,
      note: 'js-toolkit is built as its own versioned artifact and imported by an absolute, origin-relative URL so the ui-autoload engine shares one runtime instance with the ui and ui-mapbox trees.',
    },
    'ui-manifest': {
      status: 'external-cross-tree',
      url: uiManifestCdnUrl,
      note: 'The @studiometa/ui component manifest is reused from the ui tree (`/ui@<version>/manifest.js`) rather than re-bundled, so the side-effect `ui.js` entry loads exactly one manifest and its lazily-loaded component chunks from that tree.',
    },
    'ui-mapbox-manifest': {
      status: 'external-cross-tree',
      url: uiMapboxManifestCdnUrl,
      note: 'The @studiometa/ui-mapbox component manifest is reused from the ui-mapbox tree (`/ui-mapbox@<version>/manifest.js`) rather than re-bundled.',
    },
  },
  assertions: {
    jsToolkitIdentities: [toolkitIdentity],
    jsToolkitExternalUrls: [jsToolkitIndexUrl],
    treeBundlesToolkit: false,
    manifestExternalUrls: [uiManifestCdnUrl, uiMapboxManifestCdnUrl],
    treeBundlesManifests: false,
    onlyAllowedBareExternals: true,
    publicSourceMaps: true,
  },
};

// The js-toolkit, ui-mapbox and ui-autoload trees are each self-contained (they record no
// total:release), so their metadata is stable and written once. Each integrity manifest hashes every
// file in its tree including its own build.json.
for (const [treeDirectory, treeFiles, metadata] of [
  [jsToolkitOutputDirectory, jsToolkitInitialFiles, jsToolkitBuildMetadata] as const,
  [uiMapboxOutputDirectory, uiMapboxInitialFiles, uiMapboxBuildMetadata] as const,
  [uiAutoloadOutputDirectory, uiAutoloadInitialFiles, uiAutoloadBuildMetadata] as const,
]) {
  await writeJson(resolve(treeDirectory, 'build.json'), metadata);
  const integrityFiles = [...treeFiles, 'build.json'].sort();
  const integrity = {
    schemaVersion: 1,
    algorithm: 'sha384',
    excludes: ['integrity.json'],
    files: Object.fromEntries(
      await Promise.all(
        integrityFiles.map(async (file) => [file, await sha384(resolve(treeDirectory, file))]),
      ),
    ),
  };
  await writeJson(resolve(treeDirectory, 'integrity.json'), integrity);
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
  `Built ${definitions.length} components and ${totalPublicFiles} public files across ${uiTreePrefix}, ${uiMapboxTreePrefix}, ${uiAutoloadTreePrefix} and ${jsToolkitTreePrefix}.`,
);
