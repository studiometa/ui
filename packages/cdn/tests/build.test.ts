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

interface BuildMetadata {
  assertions: {
    jsToolkitIdentities: string[];
    noBareImports: boolean;
    publicSourceMaps: boolean;
    startupMapboxIsolated: boolean;
    uiComponentsMapboxIsolated: string[];
    nonGeocoderComponentsGeocoderIsolated: string[];
    unrelatedFamilyIsolated: { component: string; excludedFamily: string };
    geocoderIntegrationGraphs: number;
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
    mapboxGl: { path: string; authoritativeBundledNotice: boolean; note: string };
    mapboxGeocoder: { path: string; authoritativeBundledNotice: boolean };
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
  outputDirectory: string,
  graph: { entry: string; preload: string[] },
): Promise<string[]> {
  return (
    await Promise.all(
      [graph.entry, ...graph.preload].map(async (output) => {
        const sourceMap = JSON.parse(
          await readFile(resolve(outputDirectory, `${output}.map`), 'utf8'),
        ) as { sources: string[] };
        return sourceMap.sources;
      }),
    )
  ).flat();
}

let build: BuildMetadata;
let files: string[];

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
  build = await readJson(firstOutput, 'build.json');
  files = await listFiles(firstOutput);
}, 30_000);

afterAll(async () => {
  await rm(outputRoot, { recursive: true, force: true });
});

describe('browser CDN build', () => {
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
    expect(await readJson(secondOutput, 'build.json')).toEqual(build);
    expect(await readJson(secondOutput, 'integrity.json')).toEqual(
      await readJson(firstOutput, 'integrity.json'),
    );
    expect(await listFiles(secondOutput)).toEqual(files);

    for (const file of files) {
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
    const dirtyBuild = await readJson<BuildMetadata>(dirtyOutput, 'build.json');
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

  it('publishes complete entry, component, preload, and dynamic integration mappings', () => {
    expect(Object.keys(build.entries)).toEqual(['autoload', 'loader', 'manifest']);
    expect(Object.keys(build.components).length).toBeGreaterThan(80);
    for (const entry of Object.values(build.entries)) {
      expect(files).toContain(entry.path);
      expect(files).toContain(entry.sourceMap);
      expect(entry.preload.every((dependency) => files.includes(dependency))).toBe(true);
    }
    for (const component of Object.values(build.components)) {
      expect(files).toContain(component.entry);
      expect(component.preload.every((dependency) => files.includes(dependency))).toBe(true);
      expect(
        component.dynamicImports.every(
          ({ entry, preload }) =>
            files.includes(entry) && preload.every((dependency) => files.includes(dependency)),
        ),
      ).toBe(true);
    }

    const { entry, preload } = build.integrations['mapbox-geocoder'] as {
      entry: string;
      preload: string[];
    };
    expect(build.components.MapboxGeocoder.dynamicImports).toContainEqual({ entry, preload });
    expect(build.components.MapboxMap.dynamicImports).toEqual([]);
  });

  it('identifies exactly one geocoder integration from static graph source evidence', async () => {
    const candidates = await Promise.all(
      build.components.MapboxGeocoder.dynamicImports.map(async (dynamicImport) => {
        const sources = await staticGraphSources(firstOutput, dynamicImport);
        return {
          dynamicImport,
          containsGeocoderPackage: sources.some((source) =>
            source.includes('node_modules/@mapbox/mapbox-gl-geocoder/'),
          ),
        };
      }),
    );
    const matching = candidates.filter(({ containsGeocoderPackage }) => containsGeocoderPackage);
    expect(matching).toHaveLength(1);
    expect(build.assertions.geocoderIntegrationGraphs).toBe(1);
    expect(build.integrations['mapbox-geocoder']).toMatchObject(matching[0].dynamicImport);
  });

  it('emits public source maps, stable relative paths, and no unresolved browser imports', async () => {
    expect(build.assertions.noBareImports).toBe(true);
    expect(build.assertions.publicSourceMaps).toBe(true);
    for (const file of files.filter((path) => path.endsWith('.js'))) {
      expect(files).toContain(`${file}.map`);
    }

    for (const file of files.filter((path) => /\.(?:js|json)$/.test(path))) {
      const contents = await readFile(resolve(firstOutput, file), 'utf8');
      expect(contents).not.toContain(repositoryDirectory);
    }
    for (const file of files.filter((path) => path.endsWith('.map'))) {
      const sourceMap = JSON.parse(await readFile(resolve(firstOutput, file), 'utf8')) as {
        sources: string[];
      };
      expect(sourceMap.sources.every((source) => !/^(?:file:\/\/|\/|[A-Z]:\\)/.test(source))).toBe(
        true,
      );
    }
  });

  it('uses one js-toolkit identity and keeps startup, Mapbox, and geocoder graphs isolated', async () => {
    expect(build.assertions.jsToolkitIdentities).toEqual(['@studiometa/js-toolkit@3.8.0']);
    expect(build.assertions.startupMapboxIsolated).toBe(true);
    expect(build.assertions.uiComponentsMapboxIsolated).toEqual(
      Object.entries(build.components)
        .filter(([, component]) => component.packageName === '@studiometa/ui')
        .map(([token]) => token),
    );
    expect(build.assertions.nonGeocoderComponentsGeocoderIsolated).toEqual(
      Object.keys(build.components).filter((token) => token !== 'MapboxGeocoder'),
    );
    expect(build.assertions.unrelatedFamilyIsolated).toEqual({
      component: 'Action',
      excludedFamily: 'Accordion',
    });

    const mapboxSources = [
      '/packages/ui-mapbox/',
      '/node_modules/mapbox-gl/',
      '/node_modules/@mapbox/mapbox-gl-geocoder/',
    ];
    const uiMapboxViolations: string[] = [];
    const nonGeocoderViolations: string[] = [];
    for (const [token, component] of Object.entries(build.components)) {
      const sources = await staticGraphSources(firstOutput, component);
      if (
        component.packageName === '@studiometa/ui' &&
        sources.some((source) => mapboxSources.some((pattern) => source.includes(pattern)))
      ) {
        uiMapboxViolations.push(token);
      }
      if (
        token !== 'MapboxGeocoder' &&
        sources.some((source) => source.includes('/node_modules/@mapbox/mapbox-gl-geocoder/'))
      ) {
        nonGeocoderViolations.push(token);
      }
    }
    expect(uiMapboxViolations).toEqual([]);
    expect(nonGeocoderViolations).toEqual([]);
    const actionSources = await staticGraphSources(firstOutput, build.components.Action);
    expect(actionSources.some((source) => source.includes('/packages/ui/Accordion/'))).toBe(false);

    const geocoderEntry = (build.integrations['mapbox-geocoder'] as { entry: string }).entry;
    const startupFiles = Object.values(build.entries).flatMap(({ path, preload }) => [
      path,
      ...preload,
    ]);
    expect(startupFiles).not.toContain(geocoderEntry);
    const nonGeocoderDynamicEntries = Object.entries(build.components)
      .filter(([token]) => token !== 'MapboxGeocoder')
      .flatMap(([, component]) => component.dynamicImports.map(({ entry }) => entry));
    expect(nonGeocoderDynamicEntries).not.toContain(geocoderEntry);
  });

  it('copies Mapbox and geocoder CSS separately without auto-injection', async () => {
    expect(build.styles).toEqual({
      'mapbox-geocoder': {
        path: 'styles/mapbox-gl-geocoder.css',
        autoInject: false,
      },
      'mapbox-gl': { path: 'styles/mapbox-gl.css', autoInject: false },
    });
    expect(await readFile(resolve(firstOutput, build.styles['mapbox-gl'].path), 'utf8')).toBe(
      await readFile(
        resolve(repositoryDirectory, 'node_modules/mapbox-gl/dist/mapbox-gl.css'),
        'utf8',
      ),
    );
    expect(await readFile(resolve(firstOutput, build.styles['mapbox-geocoder'].path), 'utf8')).toBe(
      await readFile(
        resolve(
          repositoryDirectory,
          'node_modules/@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css',
        ),
        'utf8',
      ),
    );
  });

  it('records exact output sizes and enforces the checked-in budgets', async () => {
    const budgets = await readJson<{ bytes: Record<string, number> }>(
      packageDirectory,
      'size-budgets.json',
    );
    for (const [file, output] of Object.entries(build.outputs)) {
      expect((await stat(resolve(firstOutput, file))).size).toBe(output.bytes);
    }
    expect(Object.keys(build.assertions.sizeBudgets).sort()).toEqual(
      Object.keys(budgets.bytes).sort(),
    );
    for (const [name, maximum] of Object.entries(budgets.bytes)) {
      expect(build.assertions.sizeBudgets[name]).toBeTypeOf('number');
      expect(build.assertions.sizeBudgets[name]).toBeLessThanOrEqual(maximum);
    }
    const releaseBytes = (
      await Promise.all(files.map(async (file) => (await stat(resolve(firstOutput, file))).size))
    ).reduce((total, bytes) => total + bytes, 0);
    expect(build.assertions.sizeBudgets['total:release']).toBe(releaseBytes);
    expect(build.assertions.sizeBudgets['total:esm']).toBe(
      Object.entries(build.outputs)
        .filter(([file]) => file.endsWith('.js'))
        .reduce((total, [, output]) => total + output.bytes, 0),
    );
    expect(build.assertions.sizeBudgets['total:source-maps']).toBe(
      Object.entries(build.outputs)
        .filter(([file]) => file.endsWith('.map'))
        .reduce((total, [, output]) => total + output.bytes, 0),
    );
  });

  it('hashes every public output except integrity.json', async () => {
    const integrity = await readJson<{
      algorithm: string;
      excludes: string[];
      files: Record<string, string>;
    }>(firstOutput, 'integrity.json');
    expect(integrity.algorithm).toBe('sha384');
    expect(integrity.excludes).toEqual(['integrity.json']);
    expect(Object.keys(integrity.files)).toEqual(
      files.filter((file) => file !== 'integrity.json').sort((a, b) => a.localeCompare(b)),
    );
    for (const [file, hash] of Object.entries(integrity.files)) {
      expect(hash).toBe(`sha384-${await digest(resolve(firstOutput, file))}`);
    }
  });

  it('records Mapbox worker constraints, licenses, and the public redistribution gate', async () => {
    expect(build.integrations['mapbox-gl'].worker).toEqual({
      mode: 'blob',
      cspRequirement: 'worker-src blob:',
      strictCspExternalWorkerShipped: false,
      browserVerificationRequired: true,
      note: expect.stringContaining('strict-CSP external-worker build is not shipped'),
    });
    expect(build.releaseGates.publicMapboxRedistributionReview).toMatchObject({
      required: true,
      status: 'required-not-recorded',
      blocksPublicRelease: true,
    });
    expect(build.licenses.mapboxGl.authoritativeBundledNotice).toBe(true);
    expect(build.licenses.mapboxGl.note).toContain('authoritative notice');
    expect(build.licenses.mapboxGeocoder.authoritativeBundledNotice).toBe(true);
    expect(await readFile(resolve(firstOutput, build.licenses.mapboxGl.path), 'utf8')).toBe(
      await readFile(resolve(repositoryDirectory, 'node_modules/mapbox-gl/LICENSE.txt'), 'utf8'),
    );
    expect(await readFile(resolve(firstOutput, build.licenses.mapboxGeocoder.path), 'utf8')).toBe(
      await readFile(
        resolve(repositoryDirectory, 'node_modules/@mapbox/mapbox-gl-geocoder/LICENSE'),
        'utf8',
      ),
    );
  });

  it('ships third-party notices and diagnoses the excluded Shopify preview adapter', async () => {
    expect(build.licenses.esbuildLegalComments).toBe('eof');
    const notices = await readFile(resolve(firstOutput, build.licenses.thirdPartyNotices), 'utf8');
    expect(notices).toContain('mapbox-gl@');
    expect(notices).toContain('@mapbox/mapbox-gl-geocoder@');
    expect(build.integrations['shopify-partial-rendering']).toMatchObject({
      status: 'excluded-with-runtime-fallback',
      requestedSpecifier: '@shopify/partial-rendering',
      components: ['FetchShopifyPartial'],
    });
    const shopifyChunk = await readFile(
      resolve(firstOutput, build.components.FetchShopifyPartial.entry),
      'utf8',
    );
    expect(shopifyChunk).toContain('Shopify partial rendering is unavailable in this CDN build');
    expect(shopifyChunk).not.toContain('import("@shopify/partial-rendering")');
  });
});
