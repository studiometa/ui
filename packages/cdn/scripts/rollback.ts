import { parseArgs } from 'node:util';
import { createS3ObjectStore, loadObjectStoreConfig } from './lib/object-store.ts';
import { rollback, type RollbackTarget } from './lib/publication.ts';
import { loadCloudflarePurgeConfig, purgeMutableAliases } from './lib/cloudflare.ts';

const HELP = `Usage: node scripts/rollback.ts [options]

Repoints a mutable distribution tag at a previously published, indexed target. Immutable
release and channel objects are never overwritten or deleted.

Options:
  --stable-latest <version>   Repoint the latest tag at a stable release.
  --channel <main-sha>        Repoint the next and main tags at a published channel.
  -h, --help                  Show this help.

Environment:
  CDN_S3_ENDPOINT, CDN_S3_BUCKET, CDN_S3_ACCESS_KEY_ID, CDN_S3_SECRET_ACCESS_KEY   (required)
  CDN_CLOUDFLARE_API_TOKEN, CDN_CLOUDFLARE_ZONE_ID, CDN_PUBLIC_BASE_URL            (optional purge)
`;

async function main(): Promise<void> {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'stable-latest': { type: 'string' },
      channel: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: false,
  });

  if (values.help) {
    process.stdout.write(HELP);
    return;
  }

  const requested = [values['stable-latest'], values.channel].filter(Boolean);
  if (requested.length !== 1) {
    throw new Error('Specify exactly one of --stable-latest or --channel.');
  }

  let target: RollbackTarget;
  let mutableAliases: string[];
  if (values['stable-latest']) {
    target = { kind: 'release', version: values['stable-latest'] };
    mutableAliases = ['ui@latest/autoload.js'];
  } else {
    target = { kind: 'channel', channelId: values.channel as string };
    mutableAliases = ['ui@next/autoload.js', 'ui@main/autoload.js'];
  }

  const store = createS3ObjectStore(loadObjectStoreConfig(process.env));
  await rollback(store, target, { log: (message) => process.stdout.write(`${message}\n`) });

  const purge = loadCloudflarePurgeConfig(process.env);
  if (purge) {
    await purgeMutableAliases(purge, mutableAliases);
    process.stdout.write('Purged the mutable alias cache.\n');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    process.stderr.write(`Rollback failed: ${error instanceof Error ? error.message : error}\n`);
    process.exit(1);
  });
}
