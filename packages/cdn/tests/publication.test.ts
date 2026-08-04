// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  publish,
  pruneUiPreviewChannelsForPr,
  rollback,
  validatePublishability,
  type PublishTarget,
} from '../scripts/lib/publication.ts';
import { parseVersionsIndex } from '../worker/versions.ts';
import type { WorkingVersionsIndex } from '../scripts/lib/versions.ts';
import { makeArtifact, MemoryObjectStore, seedVersionsIndex } from './store-fixture.ts';

function seed(): WorkingVersionsIndex {
  return {
    schemaVersion: 2,
    packages: {
      ui: {
        releases: ['1.0.0', '2.0.0'],
        channels: ['main-000000000001', 'main-000000000002'],
        distTags: { latest: '2.0.0', next: 'main-000000000002', main: 'main-000000000002' },
      },
      'js-toolkit': { releases: ['3.8.0'] },
    },
  };
}

function seededStore(): MemoryObjectStore {
  const store = new MemoryObjectStore();
  seedVersionsIndex(store, seed());
  return store;
}

const releaseTarget: PublishTarget = { kind: 'release', packageName: 'ui', version: '2.1.0' };

describe('CDN publication', () => {
  it('stages, verifies, copies and finalizes a stable ui release before touching versions.json', async () => {
    const store = seededStore();
    const result = await publish(store, makeArtifact(), releaseTarget, { publicationId: 'pub1' });

    expect(result.finalPrefix).toBe('releases/ui/2.1.0');
    expect(store.objects.has('releases/ui/2.1.0/autoload.js')).toBe(true);
    expect(store.objects.has('releases/ui/2.1.0/build.json')).toBe(true);

    // versions.json is written only after every final copy is verified.
    const versionsPut = store.indexOfPut('versions.json');
    const lastCopy = Math.max(
      ...store.operations
        .map((entry, index) => (entry.op === 'copy' ? index : -1))
        .filter((index) => index >= 0),
    );
    expect(versionsPut).toBeGreaterThan(lastCopy);

    // Temporary objects are removed only on success.
    expect(store.keysWithPrefix('tmp/')).toHaveLength(0);
    const firstDelete = store.operations.findIndex((entry) => entry.op === 'delete');
    expect(firstDelete).toBeGreaterThan(versionsPut);

    // The resulting index advances latest and stays valid for the Worker.
    expect(result.index.packages.ui.distTags.latest).toBe('2.1.0');
    expect(() => parseVersionsIndex(result.index)).not.toThrow();
  });

  it('advances latest for a stable tag but never for a prerelease', async () => {
    const stable = await publish(seededStore(), makeArtifact(), releaseTarget, {
      publicationId: 'p',
    });
    expect(stable.index.packages.ui.distTags.latest).toBe('2.1.0');

    const prerelease = await publish(
      seededStore(),
      makeArtifact({ version: '2.2.0-beta.1' }),
      { kind: 'release', packageName: 'ui', version: '2.2.0-beta.1' },
      { publicationId: 'p' },
    );
    expect(prerelease.index.packages.ui.distTags.latest).toBe('2.0.0');
    expect(prerelease.index.packages.ui.releases).toContain('2.2.0-beta.1');
  });

  it('publishes an immutable js-toolkit release into its own namespaced prefix', async () => {
    const store = seededStore();
    const result = await publish(
      store,
      makeArtifact({ version: '3.9.0' }),
      { kind: 'release', packageName: 'js-toolkit', version: '3.9.0' },
      { publicationId: 'jt' },
    );
    expect(result.finalPrefix).toBe('releases/js-toolkit/3.9.0');
    expect(store.objects.has('releases/js-toolkit/3.9.0/build.json')).toBe(true);
    expect(result.index.packages['js-toolkit'].releases).toContain('3.9.0');
    // js-toolkit has no distribution tags, so nothing else moves.
    expect(result.index.packages.ui.distTags.latest).toBe('2.0.0');
    expect(() => parseVersionsIndex(result.index)).not.toThrow();
  });

  it('publishes a main channel and moves next and main together', async () => {
    const store = seededStore();
    const result = await publish(
      store,
      makeArtifact({ commit: 'b'.repeat(40) }),
      { kind: 'channel', commit: 'b'.repeat(40) },
      { publicationId: 'chan' },
    );
    expect(result.identity).toBe('main-bbbbbbbbbbbb');
    expect(result.index.packages.ui.distTags.next).toBe('main-bbbbbbbbbbbb');
    expect(result.index.packages.ui.distTags.main).toBe('main-bbbbbbbbbbbb');
    expect(store.objects.has('channels/main-bbbbbbbbbbbb/build.json')).toBe(true);
    expect(() => parseVersionsIndex(result.index)).not.toThrow();
  });

  it('publishes a per-PR preview channel without moving the next or main tags', async () => {
    const store = seededStore();
    const result = await publish(
      store,
      makeArtifact({ commit: 'c'.repeat(40) }),
      { kind: 'preview', pr: 42, commit: 'c'.repeat(40) },
      { publicationId: 'prev' },
    );
    expect(result.identity).toBe('pr-42-cccccccccccc');
    expect(store.objects.has('channels/pr-42-cccccccccccc/build.json')).toBe(true);
    expect(result.index.packages.ui.channels).toContain('pr-42-cccccccccccc');
    // The preview channel is addressable by its id but never becomes a distribution tag: next/main
    // stay on whatever the seed pointed them at.
    expect(result.index.packages.ui.distTags.next).toBe('main-000000000002');
    expect(result.index.packages.ui.distTags.main).toBe('main-000000000002');
    expect(() => parseVersionsIndex(result.index)).not.toThrow();
  });

  it('prunes every preview channel for a pull request and leaves other channels intact', async () => {
    const store = seededStore();
    await publish(
      store,
      makeArtifact({ commit: 'a'.repeat(40) }),
      { kind: 'preview', pr: 42, commit: 'a'.repeat(40) },
      { publicationId: 'p1' },
    );
    await publish(
      store,
      makeArtifact({ commit: 'b'.repeat(40) }),
      { kind: 'preview', pr: 42, commit: 'b'.repeat(40) },
      { publicationId: 'p2' },
    );
    await publish(
      store,
      makeArtifact({ commit: 'd'.repeat(40) }),
      { kind: 'preview', pr: 7, commit: 'd'.repeat(40) },
      { publicationId: 'p3' },
    );

    const result = await pruneUiPreviewChannelsForPr(store, 42);
    expect([...result.removed].sort()).toEqual(['pr-42-aaaaaaaaaaaa', 'pr-42-bbbbbbbbbbbb']);
    const channels = result.index.packages.ui.channels;
    expect(channels).not.toContain('pr-42-aaaaaaaaaaaa');
    expect(channels).not.toContain('pr-42-bbbbbbbbbbbb');
    // The other PR's preview and the main channels are untouched.
    expect(channels).toContain('pr-7-dddddddddddd');
    expect(channels).toContain('main-000000000002');
    expect(() => parseVersionsIndex(result.index)).not.toThrow();

    // Re-running the prune is a safe no-op.
    const again = await pruneUiPreviewChannelsForPr(store, 42);
    expect(again.removed).toEqual([]);
  });

  it('refuses to overwrite an already published immutable prefix', async () => {
    const store = seededStore();
    store.objects.set('releases/ui/2.1.0/build.json', {
      body: new Uint8Array(),
      sha384: 'sha384-existing',
    });
    await expect(publish(store, makeArtifact(), releaseTarget)).rejects.toThrow(
      /already published/,
    );
  });

  it('fails an interrupted upload and leaves temporary objects for diagnosis', async () => {
    const store = seededStore();
    store.putFailures.add('tmp/pub1/autoload.js.map');
    await expect(
      publish(store, makeArtifact(), releaseTarget, { publicationId: 'pub1' }),
    ).rejects.toThrow(/Injected upload failure/);

    expect(store.objects.has('releases/ui/2.1.0/build.json')).toBe(false);
    expect(store.keysWithPrefix('tmp/pub1/').length).toBeGreaterThan(0);
    expect(store.indexOfPut('versions.json')).toBe(-1);
  });

  it('rejects a staged upload whose read-back digest does not match', async () => {
    const store = seededStore();
    store.corruptKeys.add('tmp/pub1/autoload.js');
    await expect(
      publish(store, makeArtifact(), releaseTarget, { publicationId: 'pub1' }),
    ).rejects.toThrow(/verification failed/);
    expect(store.objects.has('releases/ui/2.1.0/autoload.js')).toBe(false);
    expect(store.keysWithPrefix('tmp/pub1/').length).toBeGreaterThan(0);
  });

  it('rejects a corrupted final copy', async () => {
    const store = seededStore();
    store.corruptKeys.add('releases/ui/2.1.0/autoload.js');
    await expect(
      publish(store, makeArtifact(), releaseTarget, { publicationId: 'pub1' }),
    ).rejects.toThrow(/Final upload verification failed/);
    expect(store.indexOfPut('versions.json')).toBe(-1);
  });

  it('rejects a build version that disagrees with the release tag', async () => {
    await expect(
      publish(seededStore(), makeArtifact({ version: '9.9.9' }), releaseTarget),
    ).rejects.toThrow(/does not match the release tag/);
  });
});

describe('publishability gates', () => {
  it('rejects a non-publishable build', () => {
    expect(() =>
      validatePublishability(makeArtifact({ publishable: false }).build, { requireClean: true }),
    ).toThrow(/non-publishable/);
  });

  it('rejects a dirty build when cleanliness is required', () => {
    expect(() =>
      validatePublishability(makeArtifact({ clean: false, publishable: false }).build, {
        requireClean: true,
      }),
    ).toThrow(/dirty build/);
  });

  it('refuses a build that reintroduces a blocking, unapproved release gate', () => {
    expect(() =>
      validatePublishability(makeArtifact({ gateStatus: 'required-not-recorded' }).build, {
        requireClean: true,
      }),
    ).toThrow(/blocking release gate/);
  });

  it('passes when the gate is recorded as approved (the build default)', () => {
    expect(() =>
      validatePublishability(makeArtifact({ gateStatus: 'approved' }).build, { requireClean: true }),
    ).not.toThrow();
  });
});

describe('CDN rollback', () => {
  function rollbackStore(): MemoryObjectStore {
    const store = seededStore();
    store.objects.set('releases/ui/1.0.0/build.json', { body: new Uint8Array(), sha384: 'x' });
    store.objects.set('channels/main-000000000001/build.json', {
      body: new Uint8Array(),
      sha384: 'x',
    });
    return store;
  }

  it('repoints latest at an older indexed release without touching immutable objects', async () => {
    const store = rollbackStore();
    const result = await rollback(store, { kind: 'release', version: '1.0.0' });
    expect(result.index.packages.ui.distTags.latest).toBe('1.0.0');
    expect(store.operations.every((entry) => entry.op !== 'copy' && entry.op !== 'delete')).toBe(
      true,
    );
    const writes = store.operations.filter((entry) => entry.op === 'put');
    expect(writes).toEqual([{ op: 'put', key: 'versions.json' }]);
  });

  it('moves next and main together on a channel rollback', async () => {
    const result = await rollback(rollbackStore(), {
      kind: 'channel',
      channelId: 'main-000000000001',
    });
    expect(result.index.packages.ui.distTags.next).toBe('main-000000000001');
    expect(result.index.packages.ui.distTags.main).toBe('main-000000000001');
  });

  it('refuses a rollback to a target that is not indexed', async () => {
    await expect(rollback(rollbackStore(), { kind: 'release', version: '9.9.9' })).rejects.toThrow(
      /not indexed/,
    );
  });

  it('refuses a rollback when no index is published', async () => {
    await expect(
      rollback(new MemoryObjectStore(), { kind: 'release', version: '1.0.0' }),
    ).rejects.toThrow(/nothing to roll back/);
  });
});
