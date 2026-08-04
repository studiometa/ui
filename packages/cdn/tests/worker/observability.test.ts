// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetch } from '../../worker/index.ts';
import {
  classifyVersion,
  emitObservation,
  ObservationRecorder,
  type AnalyticsDataset,
} from '../../worker/observability.ts';
import { MemoryR2 } from './fixtures.ts';

const origin = 'https://cdn.example.test';

class MockDataset implements AnalyticsDataset {
  readonly events: Array<{ blobs?: string[]; doubles?: number[]; indexes?: string[] }> = [];

  writeDataPoint(event: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void {
    this.events.push(event);
  }
}

/**
 * Builds a minimal but schema-valid release bucket without running the full esbuild pipeline, so
 * the observability contract can be exercised in isolation and quickly.
 */
function syntheticBucket(): MemoryR2 {
  const bucket = new MemoryR2();
  bucket.put(
    'versions.json',
    JSON.stringify({
      schemaVersion: 2,
      packages: {
        ui: {
          releases: ['1.2.0'],
          channels: ['main-abcdef1'],
          distTags: { latest: '1.2.0', next: 'main-abcdef1', main: 'main-abcdef1' },
        },
        'js-toolkit': { releases: [] },
      },
    }),
  );
  const build = {
    schemaVersion: 1,
    package: { name: '@studiometa/ui-cdn', version: '1.2.0' },
    entries: { autoload: { path: 'autoload.js', preload: [] } },
    components: {
      Action: {
        entry: 'autoload.js',
        preload: [],
        strategy: 'eager',
        packageName: '@studiometa/ui',
        subpath: 'Action',
      },
    },
    outputs: { 'autoload.js': { bytes: 1, type: 'module' } },
  };
  const integrity = {
    schemaVersion: 1,
    algorithm: 'sha384',
    excludes: ['integrity.json'],
    files: { 'autoload.js': 'sha384-AAAA', 'build.json': 'sha384-AAAA' },
  };
  bucket.put('releases/ui/1.2.0/build.json', JSON.stringify(build));
  bucket.put('releases/ui/1.2.0/integrity.json', JSON.stringify(integrity));
  bucket.put('releases/ui/1.2.0/autoload.js', 'export const cdn = 1;');
  return bucket;
}

async function observe(bucket: MemoryR2, path: string, init?: RequestInit) {
  const analytics = new MockDataset();
  const response = await fetch(new Request(`${origin}${path}`, init), {
    ASSETS: bucket,
    ANALYTICS: analytics,
  });
  return { response, event: analytics.events.at(0) };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('classifyVersion', () => {
  it('labels each resolution kind without retaining the raw token', () => {
    expect(classifyVersion('2.0.0', { kind: 'release', version: '2.0.0', objectPrefix: 'x' })).toBe(
      'exact-release',
    );
    expect(
      classifyVersion('main-abcdef1', {
        kind: 'channel',
        version: 'main-abcdef1',
        objectPrefix: 'x',
      }),
    ).toBe('exact-channel');
    expect(
      classifyVersion('latest', { kind: 'release', version: '2.0.0', objectPrefix: 'x' }),
    ).toBe('dist-tag');
    expect(classifyVersion('1', { kind: 'release', version: '1.10.0', objectPrefix: 'x' })).toBe(
      'major-alias',
    );
    expect(classifyVersion('9.9.9', undefined)).toBe('none');
  });
});

describe('emitObservation', () => {
  it('always writes a data point and samples the console line by rate', () => {
    const logs = vi.spyOn(console, 'log').mockImplementation(() => {});
    const recorder = new ObservationRecorder();
    recorder.versionKind('exact-release');
    recorder.componentCount(3);
    recorder.r2('asset', 'hit');

    const sampled = new MockDataset();
    emitObservation({ ANALYTICS: sampled, OBSERVABILITY_SAMPLE_RATE: '1' }, recorder, 200);
    expect(sampled.events).toHaveLength(1);
    expect(sampled.events[0].doubles).toEqual([200, 3]);
    expect(sampled.events[0].blobs).toContain('exact-release');
    expect(logs).toHaveBeenCalledTimes(1);

    logs.mockClear();
    const quiet = new MockDataset();
    emitObservation(
      { ANALYTICS: quiet, OBSERVABILITY_SAMPLE_RATE: '0' },
      new ObservationRecorder(),
      404,
    );
    expect(quiet.events).toHaveLength(1);
    expect(logs).not.toHaveBeenCalled();
  });

  it('never throws even if the dataset binding fails', () => {
    const failing: AnalyticsDataset = {
      writeDataPoint() {
        throw new Error('binding unavailable');
      },
    };
    expect(() =>
      emitObservation({ ANALYTICS: failing }, new ObservationRecorder(), 200),
    ).not.toThrow();
  });
});

describe('Worker request observability', () => {
  it('records a served exact release', async () => {
    const { response, event } = await observe(syntheticBucket(), '/ui@1.2.0/autoload.js');
    expect(response.status).toBe(200);
    expect(event?.blobs).toEqual(['asset', 'exact-release', 'ok', 'asset', 'hit']);
    expect(event?.doubles).toEqual([200, 0]);
  });

  it('records the eager component count for a canonical request', async () => {
    const { event } = await observe(syntheticBucket(), '/ui@1.2.0/autoload.js?components=Action');
    expect(event?.doubles?.[1]).toBe(1);
  });

  it('records a dist-tag redirect', async () => {
    const { response, event } = await observe(syntheticBucket(), '/ui@latest/autoload.js');
    expect(response.status).toBe(307);
    expect(event?.blobs?.[1]).toBe('dist-tag');
    expect(event?.blobs?.[2]).toBe('redirect');
  });

  it('records an invalid request without leaking the path', async () => {
    const { response, event } = await observe(syntheticBucket(), '/broken');
    expect(response.status).toBe(400);
    expect(event?.blobs).toEqual(['asset', 'none', 'invalid-request', 'none', 'none']);
  });

  it('records a storage-unavailable error when the index is missing', async () => {
    const { response, event } = await observe(new MemoryR2(), '/ui@1.2.0/autoload.js');
    expect(response.status).toBe(502);
    expect(event?.blobs).toEqual(['asset', 'none', 'storage-unavailable', 'index', 'miss']);
  });

  it('records a preflight request', async () => {
    const { response, event } = await observe(syntheticBucket(), '/ui@1.2.0/autoload.js', {
      method: 'OPTIONS',
    });
    expect(response.status).toBe(204);
    expect(event?.blobs?.[0]).toBe('preflight');
  });
});
