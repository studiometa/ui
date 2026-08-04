import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import {
  createS3ObjectStore,
  loadObjectStoreConfig,
  type ObjectStore,
} from './lib/object-store.ts';
import {
  publish,
  readArtifact,
  validatePublishability,
  type Artifact,
  type PublishTarget,
} from './lib/publication.ts';
import { loadCloudflarePurgeConfig, purgeMutableAliases } from './lib/cloudflare.ts';

const packageDirectory = resolve(new URL('.', import.meta.url).pathname, '..');

/** Resolves the single versioned tree directory a build emitted under a package prefix. */
async function singleTreeDirectory(root: string): Promise<{ version: string; directory: string }> {
  const entries = await readdir(root, { withFileTypes: true });
  const versions = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  if (versions.length !== 1) {
    throw new Error(`Expected exactly one versioned tree under ${root}, found ${versions.length}.`);
  }
  return { version: versions[0], directory: resolve(root, versions[0]) };
}

const HELP = `Usage: node scripts/publish.ts [options]

Publishes a built CDN artifact to immutable storage and updates the mutable version index.

Options:
  --output-dir <dir>   Build output directory (default: dist).
  --git-tag <tag>      Publish a stable release; must equal the built package version.
  --channel main       Publish the current build as an immutable main-<sha> channel.
  --pr <number>        Publish the current build as an immutable pr-<number>-<sha> preview channel
                       (addressable by its exact id; it never moves the next/main tags).
  --commit <sha>       Full 40-character commit sha for a channel or preview publication.
  -h, --help           Show this help.

Environment:
  CDN_S3_ENDPOINT, CDN_S3_BUCKET, CDN_S3_ACCESS_KEY_ID, CDN_S3_SECRET_ACCESS_KEY   (required)
  CDN_CLOUDFLARE_API_TOKEN, CDN_CLOUDFLARE_ZONE_ID, CDN_PUBLIC_BASE_URL            (optional purge)
`;

/**
 * Publishes the immutable js-toolkit tree unless the exact version is already present. js-toolkit
 * releases are immutable and never overwritten; an existing version is left untouched and its
 * release inventory entry is preserved.
 */
async function ensureJsToolkitPublished(
  store: ObjectStore,
  artifact: Artifact,
  version: string,
  log: (message: string) => void,
): Promise<void> {
  if ((await store.head(`releases/js-toolkit/${version}/build.json`)) !== undefined) {
    log(`js-toolkit ${version} is already published; leaving it untouched.`);
    return;
  }
  const result = await publish(
    store,
    artifact,
    { kind: 'release', packageName: 'js-toolkit', version },
    { log },
  );
  log(`Published js-toolkit ${result.identity} to ${result.finalPrefix}.`);
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'output-dir': { type: 'string', default: 'dist' },
      'git-tag': { type: 'string' },
      channel: { type: 'string' },
      pr: { type: 'string' },
      commit: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: false,
  });

  if (values.help) {
    process.stdout.write(HELP);
    return;
  }

  if ([values['git-tag'], values.channel, values.pr].filter(Boolean).length > 1) {
    throw new Error('Specify exactly one of --git-tag, --channel main, or --pr <number>.');
  }

  const outputDirectory = resolve(packageDirectory, values['output-dir'] ?? 'dist');

  const uiTree = await singleTreeDirectory(resolve(outputDirectory, 'releases/ui'));
  const jsToolkitTree = await singleTreeDirectory(resolve(outputDirectory, 'releases/js-toolkit'));
  const uiArtifact = await readArtifact(uiTree.directory);
  const jsToolkitArtifact = await readArtifact(jsToolkitTree.directory);

  // Both trees come from the same source state and must be clean and publishable. Neither records a
  // release gate anymore (Mapbox is external), but validatePublishability stays a dormant safeguard.
  validatePublishability(uiArtifact.build, { requireClean: true });
  validatePublishability(jsToolkitArtifact.build, { requireClean: true });

  let uiTarget: PublishTarget;
  let mutableAliases: string[];
  if (values['git-tag']) {
    uiTarget = { kind: 'release', packageName: 'ui', version: values['git-tag'] };
    mutableAliases = ['ui@latest/autoload.js'];
  } else if (values.channel === 'main') {
    const commit = values.commit ?? uiArtifact.build.build.commit;
    uiTarget = { kind: 'channel', commit };
    mutableAliases = ['ui@next/autoload.js', 'ui@main/autoload.js'];
  } else if (values.pr !== undefined) {
    const pr = Number(values.pr);
    if (!Number.isInteger(pr) || pr < 1) {
      throw new Error(`--pr expects a positive integer, received ${values.pr}.`);
    }
    const commit = values.commit ?? uiArtifact.build.build.commit;
    uiTarget = { kind: 'preview', pr, commit };
    // A preview channel is addressable only by its exact immutable id and is never aliased, so
    // there is no mutable redirect to purge.
    mutableAliases = [];
  } else {
    throw new Error(
      'Specify --git-tag <tag> for a stable release, --channel main for a channel, or --pr <number> for a preview.',
    );
  }

  const store = createS3ObjectStore(loadObjectStoreConfig(process.env));
  function log(message: string): void {
    process.stdout.write(`${message}\n`);
  }

  // js-toolkit is an immutable, shared artifact: publish it once, and only if the exact version is
  // not already present. It must exist before the ui tree that imports it becomes visible.
  await ensureJsToolkitPublished(store, jsToolkitArtifact, jsToolkitTree.version, log);

  const result = await publish(store, uiArtifact, uiTarget, { log });
  process.stdout.write(`Published ${result.identity} to ${result.finalPrefix}.\n`);

  const purge = loadCloudflarePurgeConfig(process.env);
  if (purge && mutableAliases.length > 0) {
    await purgeMutableAliases(purge, mutableAliases);
    process.stdout.write('Purged the mutable alias cache.\n');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    process.stderr.write(`Publication failed: ${error instanceof Error ? error.message : error}\n`);
    process.exit(1);
  });
}
