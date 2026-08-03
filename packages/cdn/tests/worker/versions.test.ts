// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { parseVersionsIndex, resolveVersion } from '../../worker/versions.ts';

function uiIndex(ui: { releases: string[]; channels: string[]; distTags: Record<string, string> }) {
  return {
    schemaVersion: 2,
    packages: { ui, 'js-toolkit': { releases: [] as string[] } },
  };
}

describe('versions index parsing (schemaVersion 2)', () => {
  it('accepts a stable-only ui index with no channels and no next/main tags', () => {
    // This is exactly what publish.ts writes for a first stable release before any main channel
    // exists. The Worker must serve it rather than treating the missing next/main tags as invalid.
    const index = parseVersionsIndex(
      uiIndex({ releases: ['1.9.0'], channels: [], distTags: { latest: '1.9.0' } }),
    );
    expect(resolveVersion(index, 'ui', 'latest')).toEqual({
      kind: 'release',
      version: '1.9.0',
      objectPrefix: 'releases/ui/1.9.0',
    });
    expect(resolveVersion(index, 'ui', '1')).toMatchObject({ version: '1.9.0' });
    // Undefined aliases resolve to nothing (the Worker turns this into a 404) rather than throwing.
    expect(resolveVersion(index, 'ui', 'next')).toBeUndefined();
    expect(resolveVersion(index, 'ui', 'main')).toBeUndefined();
  });

  it('accepts a freshly bootstrapped index with no releases, channels, or tags', () => {
    const index = parseVersionsIndex(uiIndex({ releases: [], channels: [], distTags: {} }));
    expect(resolveVersion(index, 'ui', 'latest')).toBeUndefined();
    expect(resolveVersion(index, 'js-toolkit', '3.8.0')).toBeUndefined();
  });

  it('keeps next and main coupled to the same published channel when either is set', () => {
    const base = { releases: ['1.9.0'], channels: ['main-abcdef1', 'main-fedcba9'] };
    // next without main is inconsistent and must be rejected.
    expect(() =>
      parseVersionsIndex(uiIndex({ ...base, distTags: { latest: '1.9.0', next: 'main-abcdef1' } })),
    ).toThrow(/distribution tags/);
    // next and main must be equal.
    expect(() =>
      parseVersionsIndex(
        uiIndex({
          ...base,
          distTags: { latest: '1.9.0', next: 'main-abcdef1', main: 'main-fedcba9' },
        }),
      ),
    ).toThrow(/next and main/);
    // Both equal and published is accepted, and resolves the channel.
    const index = parseVersionsIndex(
      uiIndex({
        ...base,
        distTags: { latest: '1.9.0', next: 'main-abcdef1', main: 'main-abcdef1' },
      }),
    );
    expect(resolveVersion(index, 'ui', 'next')).toEqual({
      kind: 'channel',
      version: 'main-abcdef1',
      objectPrefix: 'channels/main-abcdef1',
    });
  });

  it('still rejects a latest tag that does not name a published stable release', () => {
    expect(() =>
      parseVersionsIndex(
        uiIndex({ releases: ['1.9.0'], channels: [], distTags: { latest: '2.0.0' } }),
      ),
    ).toThrow(/latest tag/);
  });

  it('rejects an index that is not schemaVersion 2 or is missing the packages map', () => {
    expect(() => parseVersionsIndex({ schemaVersion: 1 })).toThrow(/Unsupported versions index/);
    expect(() => parseVersionsIndex({ schemaVersion: 2 })).toThrow(/packages index/);
  });
});

describe('js-toolkit version resolution', () => {
  const index = parseVersionsIndex({
    schemaVersion: 2,
    packages: {
      ui: { releases: ['1.9.0'], channels: [], distTags: { latest: '1.9.0' } },
      'js-toolkit': { releases: ['3.8.0', '3.7.0'] },
    },
  });

  it('resolves an exact published js-toolkit version to its namespaced prefix', () => {
    expect(resolveVersion(index, 'js-toolkit', '3.8.0')).toEqual({
      kind: 'release',
      version: '3.8.0',
      objectPrefix: 'releases/js-toolkit/3.8.0',
    });
  });

  it('never resolves js-toolkit by alias, channel, tag, or versionless default', () => {
    expect(resolveVersion(index, 'js-toolkit', '3')).toBeUndefined();
    expect(resolveVersion(index, 'js-toolkit', '3.8')).toBeUndefined();
    expect(resolveVersion(index, 'js-toolkit', 'latest')).toBeUndefined();
    expect(resolveVersion(index, 'js-toolkit', 'main')).toBeUndefined();
    expect(resolveVersion(index, 'js-toolkit', 'main-abcdef1')).toBeUndefined();
    expect(resolveVersion(index, 'js-toolkit', '9.9.9')).toBeUndefined();
  });
});
