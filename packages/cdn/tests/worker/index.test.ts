// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fetch } from '../../worker/index.ts';
import { IMMUTABLE_CACHE_CONTROL, MUTABLE_CACHE_CONTROL } from '../../worker/responses.ts';
import { createWorkerFixture, type WorkerFixture } from './fixtures.ts';

const origin = 'https://cdn.example.test';
let fixture: WorkerFixture;

function request(path: string, init?: RequestInit): Promise<Response> {
  return fetch(new Request(`${origin}${path}`, init), { ASSETS: fixture.bucket });
}

function expectCrossOriginHeaders(response: Response): void {
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, HEAD, OPTIONS');
  expect(response.headers.get('Cross-Origin-Resource-Policy')).toBe('cross-origin');
}

beforeAll(async () => {
  fixture = await createWorkerFixture();
}, 30_000);

afterAll(async () => {
  await fixture.cleanup();
});

describe('CDN Worker version routing', () => {
  it('serves published exact releases and immutable channels', async () => {
    const release = await request('/ui@1.2.0/autoload.js');
    const shortChannel = await request('/ui@main-abcdef1/autoload.js');
    const fullChannel = await request(
      '/ui@main-0123456789abcdef0123456789abcdef01234567/autoload.js',
    );

    expect(release.status).toBe(200);
    expect(shortChannel.status).toBe(200);
    expect(fullChannel.status).toBe(200);
    expect(await release.text()).toBe(fixture.files['autoload.js']);
    expect(await shortChannel.text()).toBe(fixture.files['autoload.js']);
    expect(await fullChannel.text()).toBe(fixture.files['autoload.js']);
  });

  it.each([
    ['1.2', '1.2.0'],
    ['1', '1.10.0'],
    ['latest', '2.0.0'],
    ['next', 'main-fedcba9'],
    ['main', 'main-fedcba9'],
  ])('redirects %s to the configured exact version %s', async (requested, exact) => {
    const response = await request(`/ui@${requested}/autoload.js`);
    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toBe(`${origin}/ui@${exact}/autoload.js`);
    expect(response.headers.get('Cache-Control')).toBe(MUTABLE_CACHE_CONTROL);
    expectCrossOriginHeaders(response);
  });

  it('serves published prereleases exactly but excludes them from aliases', async () => {
    expect((await request('/ui@3/autoload.js')).status).toBe(404);
    expect((await request('/ui@2.0.0-beta.1/autoload.js')).status).toBe(200);
    expect((await request('/ui@2/autoload.js')).headers.get('Location')).toBe(
      `${origin}/ui@2.0.0/autoload.js`,
    );
  });

  it('returns 404 for unpublished and incomplete releases', async () => {
    expect((await request('/ui@9.9.9/autoload.js')).status).toBe(404);
    expect((await request('/ui@main-1234567/autoload.js')).status).toBe(404);
    expect((await request('/ui@4.0.0/autoload.js')).status).toBe(404);
    expect((await request('/ui@1.0.0/not-published.js')).status).toBe(404);
  });
});

describe('CDN Worker eager component queries', () => {
  it('resolves a mutable version and canonicalizes the query in one hop', async () => {
    const response = await request(
      '/ui@1/autoload.js?unused=true&components=Modal,Action&components=Action',
    );
    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toBe(
      `${origin}/ui@1.10.0/autoload.js?components=Action,Modal`,
    );

    const exact = await fetch(new Request(response.headers.get('Location') as string), {
      ASSETS: fixture.bucket,
    });
    expect(exact.status).toBe(200);
  });

  it('sorts and deduplicates component values and strips unsupported parameters', async () => {
    const response = await request(
      '/ui@1.2.0/autoload.js?z=1&components=Modal&components=Action,Modal',
    );
    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toBe(
      `${origin}/ui@1.2.0/autoload.js?components=Action,Modal`,
    );

    const unsupported = await request('/ui@1.2.0/autoload.js?debug=true');
    expect(unsupported.headers.get('Location')).toBe(`${origin}/ui@1.2.0/autoload.js`);
    const otherAsset = await request('/ui@1.2.0/build.json?components=Action');
    expect(otherAsset.headers.get('Location')).toBe(`${origin}/ui@1.2.0/build.json`);
  });

  it('rejects empty, malformed, unknown, and excessive component lists', async () => {
    expect((await request('/ui@1.2.0/autoload.js?components=')).status).toBe(400);
    expect((await request('/ui@1.2.0/autoload.js?components=Action%20')).status).toBe(400);
    expect((await request('/ui@1.2.0/autoload.js?components=UnknownThing')).status).toBe(400);

    const tooMany = Object.keys(fixture.build.components).slice(0, 21).join(',');
    expect((await request(`/ui@1.2.0/autoload.js?components=${tooMany}`)).status).toBe(400);
  });

  it('adds bounded, deduplicated exact-version module preload links', async () => {
    const response = await request('/ui@1.2.0/autoload.js?components=Action,Modal');
    const link = response.headers.get('Link') as string;
    const links = link.split(', ');

    expect(response.status).toBe(200);
    expect(link.length).toBeLessThanOrEqual(7_500);
    expect(new Set(links).size).toBe(links.length);
    expect(link).toContain(
      `</ui@1.2.0/${fixture.build.components.Action.entry}>; rel=modulepreload`,
    );
    expect(link).toContain(
      `</ui@1.2.0/${fixture.build.components.Modal.entry}>; rel=modulepreload`,
    );
    expect(link).toContain(
      `</ui@1.2.0/${fixture.build.components.Action.preload[0]}>; rel=modulepreload`,
    );
    expect(link).not.toContain('releases/');

    const twentyTokens = Object.keys(fixture.build.components).slice(0, 20).sort();
    const bounded = await request(`/ui@1.2.0/autoload.js?components=${twentyTokens.join(',')}`);
    const boundedLink = bounded.headers.get('Link') as string;
    expect(bounded.status).toBe(200);
    expect(boundedLink.length).toBeLessThanOrEqual(7_500);
    for (const token of twentyTokens) {
      expect(boundedLink).toContain(
        `</ui@1.2.0/${fixture.build.components[token].entry}>; rel=modulepreload`,
      );
    }
  });

  it('keeps the canonical component query as cache identity while serving a static body', async () => {
    const action = await request('/ui@1.2.0/autoload.js?components=Action');
    const modal = await request('/ui@1.2.0/autoload.js?components=Modal');

    expect(action.headers.get('Link')).not.toBe(modal.headers.get('Link'));
    expect(await action.text()).toBe(await modal.text());
    expect(action.headers.get('Cache-Control')).toBe(IMMUTABLE_CACHE_CONTROL);
  });
});

describe('CDN Worker request validation', () => {
  it.each([
    '/ui@1.2.0/chunks//file.js',
    '/ui@1.2.0/chunks/%2Ffile.js',
    '/ui@1.2.0/chunks/%5Cfile.js',
    '/ui@1.2.0/chunks/%252e%252e/file.js',
    '/ui@1.2.0/chunks/%ZZ/file.js',
    '/ui@/autoload.js',
    '/ui@1.2.0/',
  ])('rejects malformed or traversal path %s', async (path) => {
    expect((await request(path)).status).toBe(400);
  });

  it('rejects unsupported package prefixes without exposing storage keys', async () => {
    const response = await request('/other@1.2.0/autoload.js');
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain('releases/');
  });

  it('supports only GET, HEAD, and OPTIONS', async () => {
    const response = await request('/ui@1.2.0/autoload.js', { method: 'POST' });
    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('GET, HEAD, OPTIONS');
    expectCrossOriginHeaders(response);
  });

  it('answers module CORS preflight without accessing R2', async () => {
    fixture.bucket.requests.length = 0;
    const response = await request('/ui@1.2.0/autoload.js', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://app.example.test',
        'Access-Control-Request-Method': 'GET',
      },
    });
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('If-None-Match');
    expectCrossOriginHeaders(response);
    expect(fixture.bucket.requests).toEqual([]);
  });
});

describe('CDN Worker asset responses', () => {
  it.each([
    ['autoload.js', 'text/javascript; charset=utf-8'],
    ['build.json', 'application/json; charset=utf-8'],
    ['autoload.js.map', 'application/json; charset=utf-8'],
    ['styles/mapbox-gl.css', 'text/css; charset=utf-8'],
    ['licenses/THIRD_PARTY_LICENSES.txt', 'text/plain; charset=utf-8'],
  ])('serves %s with the correct MIME and cross-origin headers', async (asset, mime) => {
    const response = await request(`/ui@1.2.0/${asset}`);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(mime);
    expect(response.headers.get('Cache-Control')).toBe(IMMUTABLE_CACHE_CONTROL);
    expectCrossOriginHeaders(response);
  });

  it('preserves R2 ETags and implements If-None-Match', async () => {
    const first = await request('/ui@1.2.0/autoload.js');
    const etag = first.headers.get('ETag') as string;
    expect(etag).toBe('"1.2.0-autoload.js"');

    const response = await request('/ui@1.2.0/autoload.js', {
      headers: { 'If-None-Match': `W/${etag}` },
    });
    expect(response.status).toBe(304);
    expect(await response.text()).toBe('');
    expect(response.headers.get('ETag')).toBe(etag);
    expectCrossOriginHeaders(response);
  });

  it('handles HEAD with the same asset headers and no body', async () => {
    const response = await request('/ui@1.2.0/autoload.js?components=Action', {
      method: 'HEAD',
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('');
    expect(response.headers.get('ETag')).toBe('"1.2.0-autoload.js"');
    expect(response.headers.get('Link')).toContain('rel=modulepreload');
  });
});

describe('CDN Worker storage failures', () => {
  it('returns a non-leaking 502 when the index is unavailable or invalid', async () => {
    fixture.bucket.failures.add('versions.json');
    const failed = await request('/ui@1.2.0/autoload.js');
    fixture.bucket.failures.delete('versions.json');
    expect(failed.status).toBe(502);
    expect(await failed.text()).not.toContain('versions.json');
    expectCrossOriginHeaders(failed);

    const original = fixture.bucket.objects.get('versions.json') as NonNullable<
      ReturnType<typeof fixture.bucket.objects.get>
    >;
    fixture.bucket.put('versions.json', '{"schemaVersion":2}');
    expect((await request('/ui@1.2.0/autoload.js')).status).toBe(502);

    const divergentChannels = structuredClone(
      JSON.parse(original.contents) as {
        distTags: { main: string };
      },
    );
    divergentChannels.distTags.main = 'main-abcdef1';
    fixture.bucket.put('versions.json', JSON.stringify(divergentChannels));
    expect((await request('/ui@main/autoload.js')).status).toBe(502);
    fixture.bucket.objects.set('versions.json', original);
  });

  it('distinguishes missing assets from R2 metadata and asset failures', async () => {
    fixture.bucket.failures.add('releases/1.2.0/build.json');
    expect((await request('/ui@1.2.0/autoload.js')).status).toBe(502);
    fixture.bucket.failures.delete('releases/1.2.0/build.json');

    fixture.bucket.failures.add('releases/1.2.0/autoload.js');
    expect((await request('/ui@1.2.0/autoload.js')).status).toBe(502);
    fixture.bucket.failures.delete('releases/1.2.0/autoload.js');

    fixture.bucket.put('releases/1.2.0/unknown.js', 'uploaded but not published');
    expect((await request('/ui@1.2.0/unknown.js')).status).toBe(404);
    fixture.bucket.objects.delete('releases/1.2.0/unknown.js');
  });
});
