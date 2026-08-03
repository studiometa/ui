import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { createS3ObjectStore, loadObjectStoreConfig } from './lib/object-store.ts';
import {
  publish,
  readArtifact,
  validatePublishability,
  type PublishTarget,
} from './lib/publication.ts';
import { loadCloudflarePurgeConfig, purgeMutableAliases } from './lib/cloudflare.ts';

const packageDirectory = resolve(new URL('.', import.meta.url).pathname, '..');

const HELP = `Usage: node scripts/publish.ts [options]

Publishes a built CDN artifact to immutable storage and updates the mutable version index.

Options:
  --output-dir <dir>   Build output directory (default: dist).
  --git-tag <tag>      Publish a stable release; must equal the built package version.
  --channel main       Publish the current build as an immutable main-<sha> channel.
  --commit <sha>       Full 40-character commit sha for a main channel publication.
  -h, --help           Show this help.

Environment:
  CDN_S3_ENDPOINT, CDN_S3_BUCKET, CDN_S3_ACCESS_KEY_ID, CDN_S3_SECRET_ACCESS_KEY   (required)
  CDN_MAPBOX_REDISTRIBUTION_APPROVED=true                                          (legal gate)
  CDN_CLOUDFLARE_API_TOKEN, CDN_CLOUDFLARE_ZONE_ID, CDN_PUBLIC_BASE_URL            (optional purge)
`;

async function main(): Promise<void> {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'output-dir': { type: 'string', default: 'dist' },
      'git-tag': { type: 'string' },
      channel: { type: 'string' },
      commit: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: false,
  });

  if (values.help) {
    process.stdout.write(HELP);
    return;
  }

  if (values['git-tag'] && values.channel) {
    throw new Error('Specify either --git-tag or --channel main, not both.');
  }

  const outputDirectory = resolve(packageDirectory, values['output-dir'] ?? 'dist');
  const artifact = await readArtifact(outputDirectory);
  validatePublishability(artifact.build, {
    requireClean: true,
    mapboxRedistributionApproved: process.env.CDN_MAPBOX_REDISTRIBUTION_APPROVED === 'true',
  });

  let target: PublishTarget;
  let mutableAliases: string[];
  if (values['git-tag']) {
    target = { kind: 'release', version: values['git-tag'] };
    mutableAliases = ['ui@latest/autoload.js'];
  } else if (values.channel === 'main') {
    const commit = values.commit ?? artifact.build.build.commit;
    target = { kind: 'channel', commit };
    mutableAliases = ['ui@next/autoload.js', 'ui@main/autoload.js'];
  } else {
    throw new Error(
      'Specify --git-tag <tag> for a stable release or --channel main for a channel.',
    );
  }

  const store = createS3ObjectStore(loadObjectStoreConfig(process.env));
  const result = await publish(store, artifact, target, {
    log: (message) => process.stdout.write(`${message}\n`),
  });
  process.stdout.write(`Published ${result.identity} to ${result.finalPrefix}.\n`);

  const purge = loadCloudflarePurgeConfig(process.env);
  if (purge) {
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
