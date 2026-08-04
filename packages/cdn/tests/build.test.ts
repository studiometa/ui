import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFile, readFile, readdir, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const testsDirectory = dirname(fileURLToPath(import.meta.url));
const packageDirectory = resolve(testsDirectory, '..');
const repositoryDirectory = resolve(packageDirectory, '../..');
const outputRoot = resolve(packageDirectory, '.test-dist');
const firstOutput = resolve(outputRoot, 'first');
const secondOutput = resolve(outputRoot, 'second');
const fixedEpoch = '1700000000';

const uiVersion = JSON.parse(await readFile(resolve(packageDirectory, 'package.json'), 'utf8'))
  .version as string;
const jsToolkitVersion = JSON.parse(
  await readFile(
    resolve(repositoryDirectory, 'node_modules/@studiometa/js-toolkit/package.json'),
    'utf8',
  ),
).version as string;
const uiTreePrefix = `releases/ui/${uiVersion}`;
const jsToolkitTreePrefix = `releases/js-toolkit/${jsToolkitVersion}`;

interface BuildMetadata {
  package: { name: string; version: string };
  dependencies: Record<string, string>;
  assertions: {
    jsToolkitIdentities: string[];
    jsToolkitExternalUrls: string[];
    uiTreeBundlesToolkit: boolean;
    mapboxExternalSpecifiers: string[];
    uiTreeBundlesMapbox: boolean;
    onlyAllowedBareExternals: boolean;
    publicSourceMaps: boolean;
    startupMapboxIsolated: boolean;
    uiComponentsMapboxIsolated: string[];
    unrelatedFamilyIsolated: { component: string; excludedFamily: string };
    sizeBudgets: Record<string, number>;
  };
  build: {
    identifier: string;
    clean: boolean;
    publishable: boolean;
    dirtyFiles: string[];
    sourceDateEpoch: number;
    sourceTree: {
      algorithm: string;
      digest: string;
      scheme: string;
      verified: boolean;
      pathspecs: string[];
    };
  };
  entries: Record<string, { path: string; sourceMap: string; preload: string[] }>;
  components: Record<
    string,
    {
      packageName: string;
      subpath: string;
      exportName: string;
      entry: string;
      preload: string[];
      dynamicImports: Array<{ entry: string; preload: string[] }>;
      styles: string[];
      integrations: string[];
    }
  >;
  outputs: Record<string, { bytes: number; type: string }>;
  styles: Record<string, { path: string; autoInject: boolean }>;
  licenses: {
    thirdPartyNotices: string;
    esbuildLegalComments: string;
  };
  integrations: Record<string, Record<string, unknown>>;
  releaseGates: Record<string, Record<string, unknown>>;
}

async function listFiles(directory: string, root = directory): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(path, root)));
    else files.push(path.slice(root.length + 1).replaceAll('\\', '/'));
  }
  return files.sort();
}

async function readJson<T>(directory: string, name: string): Promise<T> {
  return JSON.parse(await readFile(resolve(directory, name), 'utf8'));
}

async function digest(path: string): Promise<string> {
  return createHash('sha384')
    .update(await readFile(path))
    .digest('base64');
}

async function staticGraphSources(
  treeDirectory: string,
  graph: { entry: string; preload: string[] },
): Promise<string[]> {
  return (
    await Promise.all(
      [graph.entry, ...graph.preload].map(async (output) => {
        const sourceMap = JSON.parse(
          await readFile(resolve(treeDirectory, `${output}.map`), 'utf8'),
        ) as { sources: string[] };
        return sourceMap.sources;
      }),
    )
  ).flat();
}

let build: BuildMetadata;
let jsToolkitBuild: {
  package: { name: string; version: string };
  entries: Record<string, { path: string }>;
};
// The whole dist tree (spanning both packages) used for reproducibility.
let allFiles: string[];
// The ui tree relative to its own release prefix, used for ui-relative build.json assertions.
let uiFiles: string[];
let jsToolkitFiles: string[];
let uiTree: string;
let jsToolkitTree: string;

beforeAll(async () => {
  await rm(outputRoot, { recursive: true, force: true });
  const environment = { ...process.env, SOURCE_DATE_EPOCH: fixedEpoch };
  for (const output of [firstOutput, secondOutput]) {
    execFileSync(
      process.execPath,
      [resolve(packageDirectory, 'scripts/build.ts'), '--outdir', output, '--allow-dirty'],
      { cwd: repositoryDirectory, env: environment, stdio: 'pipe' },
    );
  }
  uiTree = resolve(firstOutput, uiTreePrefix);
  jsToolkitTree = resolve(firstOutput, jsToolkitTreePrefix);
  build = await readJson(uiTree, 'build.json');
  jsToolkitBuild = await readJson(jsToolkitTree, 'build.json');
  allFiles = await listFiles(firstOutput);
  uiFiles = await listFiles(uiTree);
  jsToolkitFiles = await listFiles(jsToolkitTree);
}, 60_000);

afterAll(async () => {
  await rm(outputRoot, { recursive: true, force: true });
});

describe('browser CDN build', () => {
  it('emits both a ui tree and a versioned js-toolkit tree', () => {
    expect(allFiles.some((file) => file.startsWith(`${uiTreePrefix}/`))).toBe(true);
    expect(allFiles.some((file) => file.startsWith(`${jsToolkitTreePrefix}/`))).toBe(true);
    expect(build.package.name).toBe('@studiometa/ui-cdn');
    expect(build.package.version).toBe(uiVersion);
    expect(build.dependencies['@studiometa/js-toolkit']).toBe(jsToolkitVersion);
    expect(jsToolkitBuild.package.name).toBe('@studiometa/ui-cdn-js-toolkit');
    expect(jsToolkitBuild.package.version).toBe(jsToolkitVersion);
  });

  it('serves the js-toolkit index and utils entries from the js-toolkit tree', () => {
    expect(jsToolkitFiles).toContain('index.js');
    expect(jsToolkitFiles).toContain('utils/index.js');
    expect(jsToolkitFiles).toContain('build.json');
    expect(jsToolkitFiles).toContain('integrity.json');
    expect(jsToolkitBuild.entries.index.path).toBe('index.js');
    expect(jsToolkitBuild.entries.utils.path).toBe('utils/index.js');
  });

  it('builds deterministic files and metadata with a reproducible timestamp', async () => {
    expect(build.build.sourceDateEpoch).toBe(Number(fixedEpoch));
    expect(build.build.publishable).toBe(build.build.clean);
    expect(build.build.sourceTree).toMatchObject({
      algorithm: 'sha256',
      digest: expect.stringMatching(/^[0-9a-f]{64}$/),
      scheme: 'sorted-path-and-working-tree-content-v1',
      verified: true,
    });
    expect(build.build.identifier.includes('.dirty.')).toBe(!build.build.clean);
    expect(await readJson(resolve(secondOutput, uiTreePrefix), 'build.json')).toEqual(build);
    expect(await readJson(resolve(secondOutput, uiTreePrefix), 'integrity.json')).toEqual(
      await readJson(uiTree, 'integrity.json'),
    );
    expect(await listFiles(secondOutput)).toEqual(allFiles);

    for (const file of allFiles) {
      expect(await digest(resolve(secondOutput, file))).toBe(
        await digest(resolve(firstOutput, file)),
      );
    }
  });

  it('refuses tracked dirty sources by default and labels an explicit local override', async () => {
    const isolatedIndex = resolve(outputRoot, 'dirty-index');
    const gitIndex = execFileSync(
      'git',
      ['rev-parse', '--path-format=absolute', '--git-path', 'index'],
      { cwd: repositoryDirectory, encoding: 'utf8' },
    ).trim();
    await copyFile(gitIndex, isolatedIndex);
    const replacementBlob = execFileSync(
      'git',
      ['rev-parse', 'HEAD:packages/ui/Accordion/Accordion.ts'],
      { cwd: repositoryDirectory, encoding: 'utf8' },
    ).trim();
    const environment = {
      ...process.env,
      SOURCE_DATE_EPOCH: fixedEpoch,
      GIT_INDEX_FILE: isolatedIndex,
    };
    execFileSync(
      'git',
      ['update-index', '--cacheinfo', '100644', replacementBlob, 'packages/ui/Action/Action.ts'],
      { cwd: repositoryDirectory, env: environment, stdio: 'pipe' },
    );

    expect(() =>
      execFileSync(
        process.execPath,
        [
          resolve(packageDirectory, 'scripts/build.ts'),
          '--outdir',
          resolve(outputRoot, 'dirty-refused'),
        ],
        { cwd: repositoryDirectory, env: environment, stdio: 'pipe' },
      ),
    ).toThrow(/Refusing a release-style CDN build with tracked build sources changed/);

    const dirtyOutput = resolve(outputRoot, 'dirty-allowed');
    execFileSync(
      process.execPath,
      [resolve(packageDirectory, 'scripts/build.ts'), '--outdir', dirtyOutput, '--allow-dirty'],
      { cwd: repositoryDirectory, env: environment, stdio: 'pipe' },
    );
    const dirtyBuild = await readJson<BuildMetadata>(
      resolve(dirtyOutput, uiTreePrefix),
      'build.json',
    );
    expect(dirtyBuild.build).toMatchObject({
      clean: false,
      publishable: false,
    });
    expect(dirtyBuild.build.dirtyFiles).toContain('packages/ui/Action/Action.ts');
    expect(dirtyBuild.build.dirtyFiles.every((file) => !file.includes('.test-dist'))).toBe(true);
    expect(dirtyBuild.build.identifier).toMatch(/\.dirty\.[0-9a-f]{64}$/);
    expect(dirtyBuild.build.sourceTree).toMatchObject({
      algorithm: 'sha256',
      verified: true,
    });
  });

  it('externalizes js-toolkit to one absolute URL and bundles no js-toolkit source in the ui tree', async () => {
    expect(build.assertions.uiTreeBundlesToolkit).toBe(false);
    expect(build.assertions.jsToolkitExternalUrls).toContain(
      `/js-toolkit@${jsToolkitVersion}/index.js`,
    );
    // Every external URL points at the built js-toolkit version.
    for (const url of build.assertions.jsToolkitExternalUrls) {
      expect(url.startsWith(`/js-toolkit@${jsToolkitVersion}/`)).toBe(true);
    }

    const uiJsFiles = uiFiles.filter((file) => file.endsWith('.js'));
    let importsIndexUrl = false;
    for (const file of uiJsFiles) {
      const contents = await readFile(resolve(uiTree, file), 'utf8');
      // No ui output may carry bundled js-toolkit source.
      expect(contents.includes('node_modules/@studiometa/js-toolkit')).toBe(false);
      if (contents.includes(`/js-toolkit@${jsToolkitVersion}/index.js`)) importsIndexUrl = true;
    }
    expect(importsIndexUrl).toBe(true);

    // The js-toolkit tree owns the source and never re-imports itself by URL.
    for (const file of jsToolkitFiles.filter((path) => path.endsWith('.js'))) {
      const contents = await readFile(resolve(jsToolkitTree, file), 'utf8');
      expect(contents.includes('/js-toolkit@')).toBe(false);
    }
  });

  it('publishes complete entry, component, preload, and dynamic integration mappings', () => {
    expect(Object.keys(build.entries).sort()).toEqual(['autoload', 'index', 'loader', 'manifest']);
    expect(Object.keys(build.components).length).toBeGreaterThan(80);
    for (const entry of Object.values(build.entries)) {
      expect(uiFiles).toContain(entry.path);
      expect(uiFiles).toContain(entry.sourceMap);
      expect(entry.preload.every((dependency) => uiFiles.includes(dependency))).toBe(true);
    }
    for (const component of Object.values(build.components)) {
      expect(uiFiles).toContain(component.entry);
      expect(component.preload.every((dependency) => uiFiles.includes(dependency))).toBe(true);
      expect(
        component.dynamicImports.every(
          ({ entry, preload }) =>
            uiFiles.includes(entry) && preload.every((dependency) => uiFiles.includes(dependency)),
        ),
      ).toBe(true);
    }

    // Mapbox GL and the geocoder are external (import-map resolved), so no Mapbox component pulls a
    // bundled Mapbox chunk — MapboxGeocoder and MapboxMap alike have no dynamic imports.
    expect(build.components.MapboxGeocoder.dynamicImports).toEqual([]);
    expect(build.components.MapboxMap.dynamicImports).toEqual([]);
  });

  it('emits a stable, non-hashed <subpath>.js entry at the ui tree root for every component', async () => {
    const reserved = new Set(['autoload.js', 'loader.js', 'manifest.js', 'index.js']);
    const seen = new Set<string>();
    for (const component of Object.values(build.components)) {
      // The entry is the stable subpath file at the tree root, not a hashed shared chunk.
      expect(component.entry).toBe(`${component.subpath}.js`);
      expect(component.entry).not.toMatch(/^chunks\//);
      expect(component.entry).not.toMatch(/-[0-9A-Z]{8}\.js$/);
      expect(reserved.has(component.entry)).toBe(false);
      expect(uiFiles).toContain(component.entry);
      expect(uiFiles).toContain(`${component.entry}.map`);
      // Subpaths mirror the npm subpath exports one-to-one, so entries never collide.
      expect(seen.has(component.entry)).toBe(false);
      seen.add(component.entry);
    }

    // A @studiometa/ui and a @studiometa/ui-mapbox sample are each served and re-export the
    // component, so `import { X } from "/ui@<ref>/X.js"` mirrors the npm subpath export.
    for (const [subpath, exportName] of [
      ['Action', 'Action'],
      ['MapboxMap', 'MapboxMap'],
    ] as const) {
      const component = Object.values(build.components).find((entry) => entry.subpath === subpath);
      expect(component).toBeDefined();
      expect(uiFiles).toContain(`${subpath}.js`);
      const source = await readFile(resolve(uiTree, `${subpath}.js`), 'utf8');
      expect(source).toMatch(new RegExp(`\\bas ${exportName}\\b`));
      // js-toolkit is resolved through the single external URL somewhere in the entry's static
      // graph (the entry or a shared chunk it imports, depending on code-splitting), never by
      // bundling js-toolkit source.
      const graph = [`${subpath}.js`, ...component!.preload];
      const graphSources = await Promise.all(
        graph.map((file) => readFile(resolve(uiTree, file), 'utf8')),
      );
      expect(
        graphSources.some((text) => text.includes(`/js-toolkit@${jsToolkitVersion}/index.js`)),
      ).toBe(true);
    }
  });

  it('externalizes Mapbox and the geocoder instead of bundling their source', async () => {
    expect(build.assertions.uiTreeBundlesMapbox).toBe(false);
    expect(build.assertions.mapboxExternalSpecifiers).toEqual(
      expect.arrayContaining(['mapbox-gl', '@mapbox/mapbox-gl-geocoder']),
    );
    expect(build.integrations['mapbox-gl']).toMatchObject({
      status: 'external-import-map',
      importSpecifier: 'mapbox-gl',
    });
    expect(build.integrations['mapbox-geocoder']).toMatchObject({
      status: 'external-import-map',
      importSpecifier: '@mapbox/mapbox-gl-geocoder',
    });
    // Neither Mapbox library's source is bundled into any output across the whole release.
    for (const file of allFiles.filter((path) => path.endsWith('.map'))) {
      const sourceMap = JSON.parse(await readFile(resolve(firstOutput, file), 'utf8')) as {
        sources: string[];
      };
      expect(
        sourceMap.sources.some(
          (source) =>
            source.includes('node_modules/mapbox-gl/') ||
            source.includes('node_modules/@mapbox/mapbox-gl-geocoder/'),
        ),
      ).toBe(false);
    }
  });

  it('emits public source maps, stable relative paths, and only allowed bare externals', async () => {
    expect(build.assertions.onlyAllowedBareExternals).toBe(true);
    expect(build.assertions.publicSourceMaps).toBe(true);
    for (const file of allFiles.filter((path) => path.endsWith('.js'))) {
      expect(allFiles).toContain(`${file}.map`);
    }

    for (const file of allFiles.filter((path) => /\.(?:js|json)$/.test(path))) {
      const contents = await readFile(resolve(firstOutput, file), 'utf8');
      expect(contents).not.toContain(repositoryDirectory);
    }
    for (const file of allFiles.filter((path) => path.endsWith('.map'))) {
      const sourceMap = JSON.parse(await readFile(resolve(firstOutput, file), 'utf8')) as {
        sources: string[];
      };
      expect(sourceMap.sources.every((source) => !/^(?:file:\/\/|\/|[A-Z]:\\)/.test(source))).toBe(
        true,
      );
    }
  });

  it('uses one js-toolkit identity and keeps startup and Mapbox graphs isolated', async () => {
    expect(build.assertions.jsToolkitIdentities).toEqual([
      `@studiometa/js-toolkit@${jsToolkitVersion}`,
    ]);
    expect(build.assertions.startupMapboxIsolated).toBe(true);
    expect(build.assertions.uiComponentsMapboxIsolated).toEqual(
      Object.entries(build.components)
        .filter(([, component]) => component.packageName === '@studiometa/ui')
        .map(([token]) => token),
    );
    expect(build.assertions.unrelatedFamilyIsolated).toEqual({
      component: 'Action',
      excludedFamily: 'Accordion',
    });

    // No @studiometa/ui component pulls the Mapbox component family or (now external) libraries.
    const mapboxSources = [
      '/packages/ui-mapbox/',
      '/node_modules/mapbox-gl/',
      '/node_modules/@mapbox/mapbox-gl-geocoder/',
    ];
    const uiMapboxViolations: string[] = [];
    for (const [token, component] of Object.entries(build.components)) {
      if (component.packageName !== '@studiometa/ui') continue;
      const sources = await staticGraphSources(uiTree, component);
      if (sources.some((source) => mapboxSources.some((pattern) => source.includes(pattern)))) {
        uiMapboxViolations.push(token);
      }
    }
    expect(uiMapboxViolations).toEqual([]);
    const actionSources = await staticGraphSources(uiTree, build.components.Action);
    expect(actionSources.some((source) => source.includes('/packages/ui/Accordion/'))).toBe(false);
  });

  it('serves no Mapbox stylesheets or license notices', async () => {
    // Externalized Mapbox means the CDN serves no stylesheets at all and no Mapbox license files
    // (the component chunks named Mapbox* are our own classes and are still served).
    expect(build.styles).toEqual({});
    expect(uiFiles.some((file) => file.startsWith('styles/'))).toBe(false);
    expect(uiFiles.filter((file) => file.startsWith('licenses/'))).toEqual([
      'licenses/THIRD_PARTY_LICENSES.txt',
    ]);
    expect(uiFiles.some((file) => /licenses\/.*mapbox/i.test(file))).toBe(false);
  });

  it('records exact output sizes and enforces the checked-in budgets', async () => {
    const budgets = await readJson<{ bytes: Record<string, number> }>(
      packageDirectory,
      'size-budgets.json',
    );
    for (const [file, output] of Object.entries(build.outputs)) {
      expect((await stat(resolve(uiTree, file))).size).toBe(output.bytes);
    }
    expect(Object.keys(build.assertions.sizeBudgets).sort()).toEqual(
      Object.keys(budgets.bytes).sort(),
    );
    for (const [name, maximum] of Object.entries(budgets.bytes)) {
      expect(build.assertions.sizeBudgets[name]).toBeTypeOf('number');
      expect(build.assertions.sizeBudgets[name]).toBeLessThanOrEqual(maximum);
    }

    // total:release spans every published file across both trees.
    const releaseBytes = (
      await Promise.all(allFiles.map(async (file) => (await stat(resolve(firstOutput, file))).size))
    ).reduce((total, bytes) => total + bytes, 0);
    expect(build.assertions.sizeBudgets['total:release']).toBe(releaseBytes);

    const esmBytes = (
      await Promise.all(
        allFiles
          .filter((file) => file.endsWith('.js'))
          .map(async (file) => (await stat(resolve(firstOutput, file))).size),
      )
    ).reduce((total, bytes) => total + bytes, 0);
    expect(build.assertions.sizeBudgets['total:esm']).toBe(esmBytes);

    const sourceMapBytes = (
      await Promise.all(
        allFiles
          .filter((file) => file.endsWith('.map'))
          .map(async (file) => (await stat(resolve(firstOutput, file))).size),
      )
    ).reduce((total, bytes) => total + bytes, 0);
    expect(build.assertions.sizeBudgets['total:source-maps']).toBe(sourceMapBytes);
  });

  it('hashes every public output except integrity.json in each tree', async () => {
    for (const [tree, treeFiles] of [
      [uiTree, uiFiles],
      [jsToolkitTree, jsToolkitFiles],
    ] as const) {
      const integrity = await readJson<{
        algorithm: string;
        excludes: string[];
        files: Record<string, string>;
      }>(tree, 'integrity.json');
      expect(integrity.algorithm).toBe('sha384');
      expect(integrity.excludes).toEqual(['integrity.json']);
      expect(Object.keys(integrity.files)).toEqual(
        treeFiles.filter((file) => file !== 'integrity.json').sort((a, b) => a.localeCompare(b)),
      );
      for (const [file, hash] of Object.entries(integrity.files)) {
        expect(hash).toBe(`sha384-${await digest(resolve(tree, file))}`);
      }
    }
  });

  it('records Mapbox as external import-map integrations and drops the redistribution gate', async () => {
    // The Mapbox libraries are no longer bundled or served, so there is no bundled-worker note, no
    // Mapbox license notice and no redistribution review gate to record.
    expect(build.integrations['mapbox-gl']).not.toHaveProperty('worker');
    expect(build.integrations['mapbox-gl'].note).toContain('import map');
    expect(build.integrations['mapbox-gl'].note).toContain('strict-CSP');
    expect(build.integrations['mapbox-geocoder'].note).toContain('import map');
    expect(build.releaseGates).toEqual({});
    expect(build.licenses).toEqual({
      thirdPartyNotices: 'licenses/THIRD_PARTY_LICENSES.txt',
      esbuildLegalComments: 'eof',
    });
  });

  it('ships third-party notices and diagnoses the excluded Shopify preview adapter', async () => {
    expect(build.licenses.esbuildLegalComments).toBe('eof');
    const notices = await readFile(resolve(uiTree, build.licenses.thirdPartyNotices), 'utf8');
    // Mapbox GL and the geocoder are external and not bundled, so they carry no third-party notice.
    expect(notices).not.toContain('mapbox-gl@');
    expect(notices).not.toContain('@mapbox/mapbox-gl-geocoder@');
    // js-toolkit is no longer bundled into the ui tree, so its notice lives in the js-toolkit tree.
    const jsToolkitNotices = await readFile(
      resolve(jsToolkitTree, 'licenses/THIRD_PARTY_LICENSES.txt'),
      'utf8',
    );
    expect(jsToolkitNotices).toContain('@studiometa/js-toolkit@');
    expect(build.integrations['shopify-partial-rendering']).toMatchObject({
      status: 'excluded-with-runtime-fallback',
      requestedSpecifier: '@shopify/partial-rendering',
      components: ['FetchShopifyPartial'],
    });
    // The ui barrel statically imports every component, so the FetchShopifyPartial implementation
    // may live in a shared chunk within its static graph rather than its (thin) entry file.
    const shopifyGraph = [
      build.components.FetchShopifyPartial.entry,
      ...build.components.FetchShopifyPartial.preload,
    ];
    const shopifySources = await Promise.all(
      shopifyGraph.map((file) => readFile(resolve(uiTree, file), 'utf8')),
    );
    expect(
      shopifySources.some((source) =>
        source.includes('Shopify partial rendering is unavailable in this CDN build'),
      ),
    ).toBe(true);
    for (const source of shopifySources) {
      expect(source).not.toContain('import("@shopify/partial-rendering")');
    }
  });
});
