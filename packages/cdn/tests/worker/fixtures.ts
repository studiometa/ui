import { execFileSync } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  BuildMetadata,
  IntegrityMetadata,
  R2BucketLike,
  R2ObjectBodyLike,
  VersionsIndex,
} from '../../worker/types.ts';

const testsDirectory = dirname(fileURLToPath(import.meta.url));
const packageDirectory = resolve(testsDirectory, '../..');
const repositoryDirectory = resolve(packageDirectory, '../..');
const outputDirectory = resolve(packageDirectory, '.test-dist/worker');

// The fake ui release inventory the Worker resolves against. The built ui tree's build.json and
// assets are cloned under each of these versions so version routing can be exercised without a
// separate build per version.
const uiReleases = ['1.0.0', '1.2.0', '1.10.0', '2.0.0-beta.1', '2.0.0', '3.0.0-beta.1', '4.0.0'];
const uiChannels = [
  'main-abcdef1',
  'main-fedcba9',
  'main-0123456789abcdef0123456789abcdef01234567',
];

class MemoryObject implements R2ObjectBodyLike {
  body: string;
  httpEtag: string;

  constructor(
    readonly contents: string,
    etag: string,
  ) {
    this.body = contents;
    this.httpEtag = `"${etag}"`;
  }

  async text(): Promise<string> {
    return this.contents;
  }
}

export class MemoryR2 implements R2BucketLike {
  readonly objects = new Map<string, MemoryObject>();
  readonly failures = new Set<string>();
  readonly requests: string[] = [];

  put(key: string, contents: string, etag = 'fixture-etag'): void {
    this.objects.set(key, new MemoryObject(contents, etag));
  }

  async get(key: string): Promise<MemoryObject | null> {
    this.requests.push(key);
    if (this.failures.has(key)) throw new Error(`Private fixture failure for ${key}`);
    return this.objects.get(key) ?? null;
  }
}

export interface WorkerFixture {
  bucket: MemoryR2;
  build: BuildMetadata;
  integrity: IntegrityMetadata;
  files: Record<string, string>;
  versionsIndex: VersionsIndex;
  jsToolkitVersion: string;
  cleanup(): Promise<void>;
}

function releaseBuild(build: BuildMetadata, version: string): BuildMetadata {
  const copy = structuredClone(build);
  copy.package.version = version;
  return copy;
}

async function readTreeFiles(
  treeDirectory: string,
  assetPaths: readonly string[],
): Promise<Record<string, string>> {
  return Object.fromEntries(
    await Promise.all(
      assetPaths.map(async (path) => [path, await readFile(resolve(treeDirectory, path), 'utf8')]),
    ),
  );
}

export async function createWorkerFixture(): Promise<WorkerFixture> {
  await rm(outputDirectory, { recursive: true, force: true });
  execFileSync(
    process.execPath,
    [resolve(packageDirectory, 'scripts/build.ts'), '--outdir', outputDirectory, '--allow-dirty'],
    {
      cwd: repositoryDirectory,
      env: { ...process.env, SOURCE_DATE_EPOCH: '1700000000' },
      stdio: 'pipe',
    },
  );

  const uiPackageVersion = JSON.parse(
    await readFile(resolve(packageDirectory, 'package.json'), 'utf8'),
  ).version as string;
  const uiTreeDirectory = resolve(outputDirectory, `releases/ui/${uiPackageVersion}`);

  const build = JSON.parse(
    await readFile(resolve(uiTreeDirectory, 'build.json'), 'utf8'),
  ) as BuildMetadata;
  const integrity = JSON.parse(
    await readFile(resolve(uiTreeDirectory, 'integrity.json'), 'utf8'),
  ) as IntegrityMetadata;
  const jsToolkitVersion = build.dependencies?.['@studiometa/js-toolkit'] as string;
  const jsToolkitTreeDirectory = resolve(
    outputDirectory,
    `releases/js-toolkit/${jsToolkitVersion}`,
  );

  const uiAssetPaths = [
    'autoload.js',
    'autoload.js.map',
    'index.js',
    'index.js.map',
    'build.json',
    'integrity.json',
    'licenses/THIRD_PARTY_LICENSES.txt',
  ];
  const files = await readTreeFiles(uiTreeDirectory, uiAssetPaths);

  const jsToolkitAssetPaths = [
    'index.js',
    'index.js.map',
    'utils/index.js',
    'utils/index.js.map',
    'build.json',
    'integrity.json',
  ];
  const jsToolkitFiles = await readTreeFiles(jsToolkitTreeDirectory, jsToolkitAssetPaths);

  const versionsIndex: VersionsIndex = {
    schemaVersion: 2,
    packages: {
      ui: {
        releases: uiReleases,
        channels: uiChannels,
        distTags: { latest: '2.0.0', next: 'main-fedcba9', main: 'main-fedcba9' },
      },
      'js-toolkit': { releases: [jsToolkitVersion] },
    },
  };

  const bucket = new MemoryR2();
  bucket.put('versions.json', JSON.stringify(versionsIndex), 'versions');

  for (const version of uiReleases) {
    const prefix = `releases/ui/${version}`;
    bucket.put(`${prefix}/build.json`, JSON.stringify(releaseBuild(build, version)));
    bucket.put(`${prefix}/integrity.json`, files['integrity.json']);
    // 4.0.0 is indexed but intentionally incomplete: only its metadata is seeded, so asset
    // requests against it must 404.
    if (version === '4.0.0') continue;
    for (const path of uiAssetPaths) {
      if (path === 'build.json' || path === 'integrity.json') continue;
      bucket.put(`${prefix}/${path}`, files[path], `${version}-${path}`);
    }
  }
  for (const channel of uiChannels) {
    const prefix = `channels/${channel}`;
    bucket.put(`${prefix}/build.json`, files['build.json']);
    bucket.put(`${prefix}/integrity.json`, files['integrity.json']);
    for (const path of uiAssetPaths) {
      if (path === 'build.json' || path === 'integrity.json') continue;
      bucket.put(`${prefix}/${path}`, files[path], `${channel}-${path}`);
    }
  }

  const jsToolkitPrefix = `releases/js-toolkit/${jsToolkitVersion}`;
  for (const path of jsToolkitAssetPaths) {
    bucket.put(`${jsToolkitPrefix}/${path}`, jsToolkitFiles[path], `js-toolkit-${path}`);
  }

  return {
    bucket,
    build,
    integrity,
    files,
    versionsIndex,
    jsToolkitVersion,
    cleanup: () => rm(outputDirectory, { recursive: true, force: true }),
  };
}
