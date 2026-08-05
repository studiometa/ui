import { parseArgs } from 'node:util';
import { createS3ObjectStore, loadObjectStoreConfig } from './lib/object-store.ts';
import { pruneUiPreviewChannelsForPr, rollback, type RollbackTarget } from './lib/publication.ts';
import { loadCloudflarePurgeConfig, purgeMutableAliases } from './lib/cloudflare.ts';

const HELP = `Usage: node scripts/rollback.ts [options]

Repoints a mutable distribution tag at a previously published, indexed target, or prunes a pull
request preview channel from the index. Immutable release and channel objects are never overwritten
or deleted.

Options:
  --stable-latest <version>   Repoint the latest tag at a stable release.
  --channel <main-sha>        Repoint the next and main tags at a published channel.
  --prune-pr <number>         Remove all of a pull request's preview channels from the index.
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
      'prune-pr': { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: false,
  });

  if (values.help) {
    process.stdout.write(HELP);
    return;
  }

  const requested = [values['stable-latest'], values.channel, values['prune-pr']].filter(Boolean);
  if (requested.length !== 1) {
    throw new Error('Specify exactly one of --stable-latest, --channel, or --prune-pr.');
  }

  // Pruning a PR's preview channels only rewrites the index (no tag move, no alias purge); handle
  // it up front and return before the tag-rollback path.
  if (values['prune-pr'] !== undefined) {
    const pr = Number(values['prune-pr']);
    if (!Number.isInteger(pr) || pr < 1) {
      throw new Error(`--prune-pr expects a positive integer, received ${values['prune-pr']}.`);
    }
    const store = createS3ObjectStore(loadObjectStoreConfig(process.env));
    await pruneUiPreviewChannelsForPr(store, pr, {
      log: (message) => process.stdout.write(`${message}\n`),
    });
    return;
  }

  let target: RollbackTarget;
  let mutableAliases: string[];
  if (values['stable-latest']) {
    target = { kind: 'release', version: values['stable-latest'] };
    mutableAliases = [
      'ui@latest/index.js',
      'ui-mapbox@latest/index.js',
      'ui-autoload@latest/index.js',
      'ui-autoload@latest/ui.js',
      'ui-autoload@latest/ui-mapbox.js',
    ];
  } else {
    target = { kind: 'channel', channelId: values.channel as string };
    mutableAliases = [
      'ui-mapbox@next/index.js',
      'ui-mapbox@main/index.js',
      'ui-autoload@next/index.js',
      'ui-autoload@next/ui.js',
      'ui-autoload@next/ui-mapbox.js',
      'ui-autoload@main/index.js',
      'ui-autoload@main/ui.js',
      'ui-autoload@main/ui-mapbox.js',
    ];
  }

  const store = createS3ObjectStore(loadObjectStoreConfig(process.env));
  await rollback(store, target, { log: (message) => process.stdout.write(`${message}\n`) });

  // Best-effort: a failed cache purge must not fail an otherwise-successful rollback (the index is
  // already updated; the purge only shortens how long a mutable alias redirect may be stale).
  const purge = loadCloudflarePurgeConfig(process.env);
  if (purge) {
    try {
      await purgeMutableAliases(purge, mutableAliases);
      process.stdout.write('Purged the mutable alias cache.\n');
    } catch (error) {
      process.stderr.write(
        `Warning: mutable alias cache purge failed (non-fatal): ${error instanceof Error ? error.message : error}\n`,
      );
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    process.stderr.write(`Rollback failed: ${error instanceof Error ? error.message : error}\n`);
    process.exit(1);
  });
}
