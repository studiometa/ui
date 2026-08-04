// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { parseVersionsIndex, resolveBareRoot, resolveVersion } from '../../worker/versions.ts';

function uiIndex(ui: { releases: string[]; channels: string[]; distTags: Record<string, string> }) {
  // ui-mapbox is validated identically to ui and versioned in lockstep, so it mirrors ui here.
  return {
    schemaVersion: 2,
    packages: { ui, 'ui-mapbox': ui, 'js-toolkit': { releases: [] as string[] } },
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

  it('resolves a per-PR preview channel by its exact id without it being a distribution tag', () => {
    const index = parseVersionsIndex(
      uiIndex({
        releases: ['1.9.0'],
        // A main channel (tagged next/main) coexists with two per-PR preview channels.
        channels: ['main-abcdef1', 'pr-42-abcdef123456', 'pr-7-0123456789ab'],
        distTags: { latest: '1.9.0', next: 'main-abcdef1', main: 'main-abcdef1' },
      }),
    );
    // Preview channels resolve by their exact id to their immutable prefix.
    expect(resolveVersion(index, 'ui', 'pr-42-abcdef123456')).toEqual({
      kind: 'channel',
      version: 'pr-42-abcdef123456',
      objectPrefix: 'channels/pr-42-abcdef123456',
    });
    // They are never named by next/main — those still point at the main channel.
    expect(resolveVersion(index, 'ui', 'next')).toMatchObject({ version: 'main-abcdef1' });
    // An unindexed preview channel does not resolve.
    expect(resolveVersion(index, 'ui', 'pr-42-ffffffffffff')).toBeUndefined();
  });

  it('still rejects a latest tag that does not name a published stable release', () => {
    expect(() =>
      parseVersionsIndex(
        uiIndex({ releases: ['1.9.0'], channels: [], distTags: { latest: '2.0.0' } }),
      ),
    ).toThrow(/latest tag/);
  });

  it('rejects an index that is not schemaVersion 2 or is missing the packages map', () => {
    expect(() => parseVersionsIndex({ schemaVersion: 3 })).toThrow(/Unsupported versions index/);
    expect(() => parseVersionsIndex({ schemaVersion: 2 })).toThrow(/packages index/);
  });

  it('parses a schema-2 index that predates the ui-mapbox tree and 404s every ui-mapbox route', () => {
    // The currently-live index has no `ui-mapbox` key. It must still parse, and ui-mapbox routes
    // must resolve to nothing (a clean 404) until the package is populated by a publish.
    const index = parseVersionsIndex({
      schemaVersion: 2,
      packages: {
        ui: { releases: ['1.9.0'], channels: [], distTags: { latest: '1.9.0' } },
        'js-toolkit': { releases: ['3.8.0'] },
      },
    });
    // ui and js-toolkit keep resolving exactly as before.
    expect(resolveVersion(index, 'ui', 'latest')).toMatchObject({ version: '1.9.0' });
    expect(resolveVersion(index, 'js-toolkit', '3.8.0')).toMatchObject({ version: '3.8.0' });
    // ui-mapbox defaults to an empty package: every route 404s.
    expect(resolveVersion(index, 'ui-mapbox', 'latest')).toBeUndefined();
    expect(resolveVersion(index, 'ui-mapbox', '1.0.0')).toBeUndefined();
    expect(resolveBareRoot(index, 'ui-mapbox')).toBeUndefined();
  });

  it('resolves ui-mapbox with the full ui semantics from its own namespaced trees', () => {
    const index = parseVersionsIndex({
      schemaVersion: 2,
      packages: {
        ui: {
          releases: ['1.9.0'],
          channels: ['main-abcdef1'],
          distTags: { latest: '1.9.0', next: 'main-abcdef1', main: 'main-abcdef1' },
        },
        'ui-mapbox': {
          releases: ['1.9.0', '2.0.0'],
          channels: ['main-abcdef1'],
          distTags: { latest: '2.0.0', next: 'main-abcdef1', main: 'main-abcdef1' },
        },
        'js-toolkit': { releases: [] },
      },
    });
    expect(resolveVersion(index, 'ui-mapbox', '2.0.0')).toEqual({
      kind: 'release',
      version: '2.0.0',
      objectPrefix: 'releases/ui-mapbox/2.0.0',
    });
    expect(resolveVersion(index, 'ui-mapbox', 'latest')).toMatchObject({ version: '2.0.0' });
    expect(resolveVersion(index, 'ui-mapbox', '1')).toMatchObject({ version: '1.9.0' });
    // ui-mapbox channels are namespaced under channels/ui-mapbox/ so they never collide with ui's.
    expect(resolveVersion(index, 'ui-mapbox', 'main-abcdef1')).toEqual({
      kind: 'channel',
      version: 'main-abcdef1',
      objectPrefix: 'channels/ui-mapbox/main-abcdef1',
    });
    expect(resolveVersion(index, 'ui-mapbox', 'next')).toMatchObject({
      objectPrefix: 'channels/ui-mapbox/main-abcdef1',
    });
  });
});

describe('js-toolkit version resolution', () => {
  const index = parseVersionsIndex({
    schemaVersion: 2,
    packages: {
      ui: { releases: ['1.9.0'], channels: [], distTags: { latest: '1.9.0' } },
      'ui-mapbox': { releases: ['1.9.0'], channels: [], distTags: { latest: '1.9.0' } },
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

describe('bare package root resolution', () => {
  const index = parseVersionsIndex({
    schemaVersion: 2,
    packages: {
      ui: { releases: ['1.9.0', '2.0.0'], channels: [], distTags: { latest: '2.0.0' } },
      'ui-mapbox': { releases: ['1.9.0', '2.0.0'], channels: [], distTags: { latest: '2.0.0' } },
      // Deliberately unordered and spanning a two-digit minor to prove numeric (not lexical) order.
      'js-toolkit': { releases: ['3.7.0', '3.10.0', '3.8.0'] },
    },
  });

  it('resolves the ui root to the latest stable release', () => {
    expect(resolveBareRoot(index, 'ui')).toEqual({
      kind: 'release',
      version: '2.0.0',
      objectPrefix: 'releases/ui/2.0.0',
    });
  });

  it('resolves the ui-mapbox root to the latest stable release', () => {
    expect(resolveBareRoot(index, 'ui-mapbox')).toEqual({
      kind: 'release',
      version: '2.0.0',
      objectPrefix: 'releases/ui-mapbox/2.0.0',
    });
  });

  it('resolves the js-toolkit root to the highest published release', () => {
    expect(resolveBareRoot(index, 'js-toolkit')).toEqual({
      kind: 'release',
      version: '3.10.0',
      objectPrefix: 'releases/js-toolkit/3.10.0',
    });
  });

  it('resolves to nothing when the package has no eligible release', () => {
    const empty = parseVersionsIndex(uiIndex({ releases: [], channels: [], distTags: {} }));
    expect(resolveBareRoot(empty, 'ui')).toBeUndefined();
    expect(resolveBareRoot(empty, 'js-toolkit')).toBeUndefined();
  });
});
