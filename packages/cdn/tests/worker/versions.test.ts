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

  it('accepts the legacy coupled shape (next === main === channel) and resolves both to the channel', () => {
    // This is the exact shape the currently-live production index carries and that publish.ts keeps
    // writing in this PR: next and main both name the same published main channel. The tolerant
    // Worker must keep accepting it verbatim.
    const index = parseVersionsIndex(
      uiIndex({
        releases: ['1.9.0'],
        channels: ['main-abcdef1', 'main-fedcba9'],
        distTags: { latest: '1.9.0', next: 'main-abcdef1', main: 'main-abcdef1' },
      }),
    );
    expect(resolveVersion(index, 'ui', 'next')).toEqual({
      kind: 'channel',
      version: 'main-abcdef1',
      objectPrefix: 'channels/main-abcdef1',
    });
    expect(resolveVersion(index, 'ui', 'main')).toEqual({
      kind: 'channel',
      version: 'main-abcdef1',
      objectPrefix: 'channels/main-abcdef1',
    });
  });

  it('accepts the decoupled shape (next names a prerelease release, main a channel) and resolves next to that release', () => {
    // The future Phase-2 shape: main still names the main channel, but next names the latest
    // published prerelease release, decoupled from main (next !== main). `/ui@next/` must resolve to
    // that exact release, while `/ui@main/` still resolves to the channel.
    const index = parseVersionsIndex(
      uiIndex({
        releases: ['1.9.0', '2.0.0-beta.1'],
        channels: ['main-abcdef1'],
        distTags: { latest: '1.9.0', next: '2.0.0-beta.1', main: 'main-abcdef1' },
      }),
    );
    expect(resolveVersion(index, 'ui', 'next')).toEqual({
      kind: 'release',
      version: '2.0.0-beta.1',
      objectPrefix: 'releases/ui/2.0.0-beta.1',
    });
    expect(resolveVersion(index, 'ui', 'main')).toEqual({
      kind: 'channel',
      version: 'main-abcdef1',
      objectPrefix: 'channels/main-abcdef1',
    });
  });

  it('accepts next decoupled from main without requiring them to be equal', () => {
    // next and main may name different published channels; the equality requirement is gone.
    const index = parseVersionsIndex(
      uiIndex({
        releases: ['1.9.0'],
        channels: ['main-abcdef1', 'main-fedcba9'],
        distTags: { latest: '1.9.0', next: 'main-fedcba9', main: 'main-abcdef1' },
      }),
    );
    expect(resolveVersion(index, 'ui', 'next')).toMatchObject({ version: 'main-fedcba9' });
    expect(resolveVersion(index, 'ui', 'main')).toMatchObject({ version: 'main-abcdef1' });
  });

  it('rejects a next tag that is neither a published channel nor a known release', () => {
    const base = { releases: ['1.9.0'], channels: ['main-abcdef1'] };
    // A channel-shaped id that is not in the channels inventory.
    expect(() =>
      parseVersionsIndex(uiIndex({ ...base, distTags: { latest: '1.9.0', next: 'main-0000000' } })),
    ).toThrow(/next tag/);
    // A release version that is not in the releases inventory.
    expect(() =>
      parseVersionsIndex(uiIndex({ ...base, distTags: { latest: '1.9.0', next: '9.9.9' } })),
    ).toThrow(/next tag/);
  });

  it('rejects a main tag that does not name a published immutable channel', () => {
    const base = { releases: ['1.9.0', '2.0.0-beta.1'], channels: ['main-abcdef1'] };
    // main must be a channel, never a release version.
    expect(() =>
      parseVersionsIndex(uiIndex({ ...base, distTags: { latest: '1.9.0', main: '2.0.0-beta.1' } })),
    ).toThrow(/main tag/);
    // main naming an unindexed channel is rejected.
    expect(() =>
      parseVersionsIndex(uiIndex({ ...base, distTags: { latest: '1.9.0', main: 'main-0000000' } })),
    ).toThrow(/main tag/);
  });

  it('accepts a next tag set without a main tag', () => {
    // With next decoupled from main, next may be set on its own (main omitted). Both a channel next
    // and a release next are valid standalone.
    const channelNext = parseVersionsIndex(
      uiIndex({
        releases: ['1.9.0'],
        channels: ['main-abcdef1'],
        distTags: { latest: '1.9.0', next: 'main-abcdef1' },
      }),
    );
    expect(resolveVersion(channelNext, 'ui', 'next')).toMatchObject({ version: 'main-abcdef1' });
    expect(resolveVersion(channelNext, 'ui', 'main')).toBeUndefined();

    const releaseNext = parseVersionsIndex(
      uiIndex({
        releases: ['1.9.0', '2.0.0-beta.1'],
        channels: [],
        distTags: { latest: '1.9.0', next: '2.0.0-beta.1' },
      }),
    );
    expect(resolveVersion(releaseNext, 'ui', 'next')).toMatchObject({
      kind: 'release',
      version: '2.0.0-beta.1',
    });
    expect(resolveVersion(releaseNext, 'ui', 'main')).toBeUndefined();
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
