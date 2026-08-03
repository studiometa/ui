// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  publish,
  rollback,
  validatePublishability,
  type PublishTarget,
} from '../scripts/lib/publication.ts';
import { parseVersionsIndex } from '../worker/versions.ts';
import type { WorkingVersionsIndex } from '../scripts/lib/versions.ts';
import { makeArtifact, MemoryObjectStore, seedVersionsIndex } from './store-fixture.ts';

function seed(): WorkingVersionsIndex {
  return {
    schemaVersion: 1,
    releases: ['1.0.0', '2.0.0'],
    channels: ['main-000000000001', 'main-000000000002'],
    distTags: { latest: '2.0.0', next: 'main-000000000002', main: 'main-000000000002' },
  };
}

function seededStore(): MemoryObjectStore {
  const store = new MemoryObjectStore();
  seedVersionsIndex(store, seed());
  return store;
}

const releaseTarget: PublishTarget = { kind: 'release', version: '2.1.0' };

describe('CDN publication', () => {
  it('stages, verifies, copies and finalizes a stable release before touching versions.json', async () => {
    const store = seededStore();
    const result = await publish(store, makeArtifact(), releaseTarget, { publicationId: 'pub1' });

    expect(result.finalPrefix).toBe('releases/2.1.0');
    expect(store.objects.has('releases/2.1.0/autoload.js')).toBe(true);
    expect(store.objects.has('releases/2.1.0/build.json')).toBe(true);

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
    expect(result.index.distTags.latest).toBe('2.1.0');
    expect(() => parseVersionsIndex(result.index)).not.toThrow();
  });

  it('advances latest for a stable tag but never for a prerelease', async () => {
    const stable = await publish(seededStore(), makeArtifact(), releaseTarget, {
      publicationId: 'p',
    });
    expect(stable.index.distTags.latest).toBe('2.1.0');

    const prerelease = await publish(
      seededStore(),
      makeArtifact({ version: '2.2.0-beta.1' }),
      { kind: 'release', version: '2.2.0-beta.1' },
      { publicationId: 'p' },
    );
    expect(prerelease.index.distTags.latest).toBe('2.0.0');
    expect(prerelease.index.releases).toContain('2.2.0-beta.1');
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
    expect(result.index.distTags.next).toBe('main-bbbbbbbbbbbb');
    expect(result.index.distTags.main).toBe('main-bbbbbbbbbbbb');
    expect(store.objects.has('channels/main-bbbbbbbbbbbb/build.json')).toBe(true);
    expect(() => parseVersionsIndex(result.index)).not.toThrow();
  });

  it('refuses to overwrite an already published immutable prefix', async () => {
    const store = seededStore();
    store.objects.set('releases/2.1.0/build.json', {
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

    expect(store.objects.has('releases/2.1.0/build.json')).toBe(false);
    expect(store.keysWithPrefix('tmp/pub1/').length).toBeGreaterThan(0);
    expect(store.indexOfPut('versions.json')).toBe(-1);
  });

  it('rejects a staged upload whose read-back digest does not match', async () => {
    const store = seededStore();
    store.corruptKeys.add('tmp/pub1/autoload.js');
    await expect(
      publish(store, makeArtifact(), releaseTarget, { publicationId: 'pub1' }),
    ).rejects.toThrow(/verification failed/);
    expect(store.objects.has('releases/2.1.0/autoload.js')).toBe(false);
    expect(store.keysWithPrefix('tmp/pub1/').length).toBeGreaterThan(0);
  });

  it('rejects a corrupted final copy', async () => {
    const store = seededStore();
    store.corruptKeys.add('releases/2.1.0/autoload.js');
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
      validatePublishability(makeArtifact({ publishable: false }).build, {
        requireClean: true,
        mapboxRedistributionApproved: true,
      }),
    ).toThrow(/non-publishable/);
  });

  it('rejects a dirty build when cleanliness is required', () => {
    expect(() =>
      validatePublishability(makeArtifact({ clean: false, publishable: false }).build, {
        requireClean: true,
        mapboxRedistributionApproved: true,
      }),
    ).toThrow(/dirty build/);
  });

  it('blocks publication while the Mapbox legal gate is unresolved', () => {
    const build = makeArtifact({ gateStatus: 'required-not-recorded' }).build;
    expect(() =>
      validatePublishability(build, { requireClean: true, mapboxRedistributionApproved: false }),
    ).toThrow(/Mapbox redistribution/);
    expect(() =>
      validatePublishability(build, { requireClean: true, mapboxRedistributionApproved: true }),
    ).not.toThrow();
  });

  it('passes when the gate is recorded as approved', () => {
    expect(() =>
      validatePublishability(makeArtifact({ gateStatus: 'approved' }).build, {
        requireClean: true,
        mapboxRedistributionApproved: false,
      }),
    ).not.toThrow();
  });
});

describe('CDN rollback', () => {
  function rollbackStore(): MemoryObjectStore {
    const store = seededStore();
    store.objects.set('releases/1.0.0/build.json', { body: new Uint8Array(), sha384: 'x' });
    store.objects.set('channels/main-000000000001/build.json', {
      body: new Uint8Array(),
      sha384: 'x',
    });
    return store;
  }

  it('repoints latest at an older indexed release without touching immutable objects', async () => {
    const store = rollbackStore();
    const result = await rollback(store, { kind: 'release', version: '1.0.0' });
    expect(result.index.distTags.latest).toBe('1.0.0');
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
    expect(result.index.distTags.next).toBe('main-000000000001');
    expect(result.index.distTags.main).toBe('main-000000000001');
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
