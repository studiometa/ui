// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { parseVersionsIndex, resolveVersion } from '../../worker/versions.ts';

describe('versions index parsing', () => {
  it('accepts a stable-only index with no channels and no next/main tags', () => {
    // This is exactly what publish.ts writes for a first stable release before any main channel
    // exists. The Worker must serve it rather than treating the missing next/main tags as invalid.
    const index = parseVersionsIndex({
      schemaVersion: 1,
      releases: ['1.9.0'],
      channels: [],
      distTags: { latest: '1.9.0' },
    });
    expect(resolveVersion(index, 'latest')).toEqual({
      kind: 'release',
      version: '1.9.0',
      objectPrefix: 'releases/1.9.0',
    });
    expect(resolveVersion(index, '1')).toMatchObject({ version: '1.9.0' });
    // Undefined aliases resolve to nothing (the Worker turns this into a 404) rather than throwing.
    expect(resolveVersion(index, 'next')).toBeUndefined();
    expect(resolveVersion(index, 'main')).toBeUndefined();
  });

  it('accepts a freshly bootstrapped index with no releases, channels, or tags', () => {
    const index = parseVersionsIndex({
      schemaVersion: 1,
      releases: [],
      channels: [],
      distTags: {},
    });
    expect(resolveVersion(index, 'latest')).toBeUndefined();
  });

  it('keeps next and main coupled to the same published channel when either is set', () => {
    const base = {
      schemaVersion: 1,
      releases: ['1.9.0'],
      channels: ['main-abcdef1', 'main-fedcba9'],
    };
    // next without main is inconsistent and must be rejected.
    expect(() =>
      parseVersionsIndex({ ...base, distTags: { latest: '1.9.0', next: 'main-abcdef1' } }),
    ).toThrow(/distribution tags/);
    // next and main must be equal.
    expect(() =>
      parseVersionsIndex({
        ...base,
        distTags: { latest: '1.9.0', next: 'main-abcdef1', main: 'main-fedcba9' },
      }),
    ).toThrow(/next and main/);
    // Both equal and published is accepted, and resolves the channel.
    const index = parseVersionsIndex({
      ...base,
      distTags: { latest: '1.9.0', next: 'main-abcdef1', main: 'main-abcdef1' },
    });
    expect(resolveVersion(index, 'next')).toEqual({
      kind: 'channel',
      version: 'main-abcdef1',
      objectPrefix: 'channels/main-abcdef1',
    });
  });

  it('still rejects a latest tag that does not name a published stable release', () => {
    expect(() =>
      parseVersionsIndex({
        schemaVersion: 1,
        releases: ['1.9.0'],
        channels: [],
        distTags: { latest: '2.0.0' },
      }),
    ).toThrow(/latest tag/);
  });
});
