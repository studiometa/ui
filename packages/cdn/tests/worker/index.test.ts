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

  it('resolves /ui@next/ to a release version when next is decoupled from main', async () => {
    // The future Phase-2 shape: next names the latest published prerelease release (decoupled from
    // the main channel that main still names). The tolerant Worker must redirect /ui@next/ to that
    // exact release, while /ui@main/ still redirects to the channel. The shared fixture bucket is
    // temporarily rewritten to this shape and restored afterwards so sibling tests are unaffected.
    const decoupled = {
      schemaVersion: 2 as const,
      packages: {
        ui: {
          releases: fixture.versionsIndex.packages.ui.releases,
          channels: fixture.versionsIndex.packages.ui.channels,
          distTags: { latest: '2.0.0', next: '2.0.0-beta.1', main: 'main-fedcba9' },
        },
        'ui-mapbox': fixture.versionsIndex.packages['ui-mapbox'],
        'js-toolkit': fixture.versionsIndex.packages['js-toolkit'],
      },
    };
    fixture.bucket.put('versions.json', JSON.stringify(decoupled), 'versions-decoupled');
    try {
      const next = await request('/ui@next/autoload.js');
      expect(next.status).toBe(307);
      expect(next.headers.get('Location')).toBe(`${origin}/ui@2.0.0-beta.1/autoload.js`);
      expect(next.headers.get('Cache-Control')).toBe(MUTABLE_CACHE_CONTROL);

      const main = await request('/ui@main/autoload.js');
      expect(main.status).toBe(307);
      expect(main.headers.get('Location')).toBe(`${origin}/ui@main-fedcba9/autoload.js`);
    } finally {
      fixture.bucket.put('versions.json', JSON.stringify(fixture.versionsIndex), 'versions');
    }
  });

  it('resolves a versionless ui package to the latest stable release', async () => {
    const response = await request('/ui/autoload.js');
    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toBe(`${origin}/ui@2.0.0/autoload.js`);
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

  it('serves the manually-importable ui barrel', async () => {
    const response = await request('/ui@1.2.0/index.js');
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/javascript; charset=utf-8');
    expect(await response.text()).toBe(fixture.files['index.js']);
  });
});

describe('CDN Worker js-toolkit package routing', () => {
  it('serves the exact-versioned js-toolkit index and utils entries', async () => {
    const index = await request(`/js-toolkit@${fixture.jsToolkitVersion}/index.js`);
    const utils = await request(`/js-toolkit@${fixture.jsToolkitVersion}/utils/index.js`);

    expect(index.status).toBe(200);
    expect(index.headers.get('Content-Type')).toBe('text/javascript; charset=utf-8');
    expect(index.headers.get('Cache-Control')).toBe(IMMUTABLE_CACHE_CONTROL);
    expectCrossOriginHeaders(index);

    expect(utils.status).toBe(200);
    expect(utils.headers.get('Content-Type')).toBe('text/javascript; charset=utf-8');
  });

  it('resolves js-toolkit by exact semver only, never by an explicit alias, channel, or tag', async () => {
    const major = fixture.jsToolkitVersion.split('.')[0];
    expect((await request('/js-toolkit@latest/index.js')).status).toBe(404);
    expect((await request(`/js-toolkit@${major}/index.js`)).status).toBe(404);
    expect((await request('/js-toolkit@main-abcdef1/index.js')).status).toBe(404);
    expect((await request('/js-toolkit@9.9.9/index.js')).status).toBe(404);
  });

  it('resolves a versionless js-toolkit request to its highest release, not a latest tag', async () => {
    // js-toolkit has no `latest` tag, so a versionless request must resolve via the bare-root ladder
    // (highest published release) rather than the `latest` an explicit `/js-toolkit@latest/` uses.
    const response = await request('/js-toolkit/index.js');
    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toBe(
      `${origin}/js-toolkit@${fixture.jsToolkitVersion}/index.js`,
    );
    expect(response.headers.get('Cache-Control')).toBe(MUTABLE_CACHE_CONTROL);
    expectCrossOriginHeaders(response);
  });
});

describe('CDN Worker ui-mapbox package routing', () => {
  it('serves the ui-mapbox barrel and per-component modules from the ui-mapbox tree', async () => {
    const barrel = await request('/ui-mapbox@1.2.0/index.js');
    const component = await request('/ui-mapbox@1.2.0/MapboxMap.js');

    expect(barrel.status).toBe(200);
    expect(barrel.headers.get('Content-Type')).toBe('text/javascript; charset=utf-8');
    expect(barrel.headers.get('Cache-Control')).toBe(IMMUTABLE_CACHE_CONTROL);
    expect(await barrel.text()).toBe(fixture.uiMapboxFiles['index.js']);
    expectCrossOriginHeaders(barrel);

    expect(component.status).toBe(200);
    expect(await component.text()).toBe(fixture.uiMapboxFiles['MapboxMap.js']);
  });

  it('resolves ui-mapbox aliases and channels exactly like ui', async () => {
    const alias = await request('/ui-mapbox@1/MapboxMap.js');
    expect(alias.status).toBe(307);
    expect(alias.headers.get('Location')).toBe(`${origin}/ui-mapbox@1.10.0/MapboxMap.js`);

    const latest = await request('/ui-mapbox@latest/index.js');
    expect(latest.status).toBe(307);
    expect(latest.headers.get('Location')).toBe(`${origin}/ui-mapbox@2.0.0/index.js`);

    const channel = await request('/ui-mapbox@main-abcdef1/MapboxMap.js');
    expect(channel.status).toBe(200);
    expect(await channel.text()).toBe(fixture.uiMapboxFiles['MapboxMap.js']);

    const next = await request('/ui-mapbox@next/index.js');
    expect(next.status).toBe(307);
    expect(next.headers.get('Location')).toBe(`${origin}/ui-mapbox@main-fedcba9/index.js`);
  });

  it('advertises the ui-mapbox declaration via X-TypeScript-Types', async () => {
    const declaration = await request('/ui-mapbox@1.2.0/MapboxMap.d.ts');
    expect(declaration.status).toBe(200);
    expect(declaration.headers.get('Content-Type')).toBe('application/typescript; charset=utf-8');
    expect(await declaration.text()).toBe(fixture.uiMapboxFiles['MapboxMap.d.ts']);

    const module = await request('/ui-mapbox@1.2.0/MapboxMap.js');
    expect(module.headers.get('X-TypeScript-Types')).toBe(
      `${origin}/ui-mapbox@1.2.0/MapboxMap.d.ts`,
    );
    expect(module.headers.get('Access-Control-Expose-Headers')).toContain('X-TypeScript-Types');
  });
});

describe('CDN Worker extensionless subpath resolution', () => {
  it('maps a versionless extensionless ui component to its .js output in one hop', async () => {
    const response = await request('/ui/Action');
    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toBe(`${origin}/ui@2.0.0/Action.js`);
    expect(response.headers.get('Cache-Control')).toBe(MUTABLE_CACHE_CONTROL);
    expectCrossOriginHeaders(response);

    const served = await fetch(new Request(response.headers.get('Location') as string), {
      ASSETS: fixture.bucket,
    });
    expect(served.status).toBe(200);
    expect(served.headers.get('Content-Type')).toBe('text/javascript; charset=utf-8');
    expect(await served.text()).toBe(fixture.files['Action.js']);
  });

  it('maps a versionless extensionless ui-mapbox component to its .js output', async () => {
    const response = await request('/ui-mapbox/MapboxMap');
    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toBe(`${origin}/ui-mapbox@2.0.0/MapboxMap.js`);

    const served = await fetch(new Request(response.headers.get('Location') as string), {
      ASSETS: fixture.bucket,
    });
    expect(served.status).toBe(200);
    expect(await served.text()).toBe(fixture.uiMapboxFiles['MapboxMap.js']);
  });

  it('maps a versionless extensionless js-toolkit subpath to its /index.js output', async () => {
    const response = await request('/js-toolkit/utils');
    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toBe(
      `${origin}/js-toolkit@${fixture.jsToolkitVersion}/utils/index.js`,
    );

    const served = await fetch(new Request(response.headers.get('Location') as string), {
      ASSETS: fixture.bucket,
    });
    expect(served.status).toBe(200);
    expect(served.headers.get('Content-Type')).toBe('text/javascript; charset=utf-8');
  });

  it('serves an exact-versioned extensionless request directly as its .js output', async () => {
    const response = await request('/ui@1.2.0/Action');
    // An immutable ref (exact semver) resolves its extensionless subpath to `Action.js` and serves it
    // directly — no redirect — so a cross-origin TS language server reads the types header inline.
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/javascript; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe(IMMUTABLE_CACHE_CONTROL);
    expect(await response.text()).toBe(fixture.files['Action.js']);
    expect(response.headers.get('X-TypeScript-Types')).toBe(`${origin}/ui@1.2.0/Action.d.ts`);
    expect(response.headers.get('Access-Control-Expose-Headers')).toContain('X-TypeScript-Types');
    expectCrossOriginHeaders(response);
  });

  it('serves an exact-versioned extensionless js-toolkit subpath directly as /index.js', async () => {
    const response = await request(`/js-toolkit@${fixture.jsToolkitVersion}/utils`);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/javascript; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe(IMMUTABLE_CACHE_CONTROL);
    expect(response.headers.get('X-TypeScript-Types')).toBe(
      `${origin}/js-toolkit@${fixture.jsToolkitVersion}/utils/index.d.ts`,
    );
    expect(response.headers.get('Access-Control-Expose-Headers')).toContain('X-TypeScript-Types');
  });

  it('serves an immutable channel extensionless subpath directly as its .js output', async () => {
    const response = await request('/ui@main-abcdef1/Action');
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/javascript; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe(IMMUTABLE_CACHE_CONTROL);
    expect(await response.text()).toBe(fixture.files['Action.js']);
    expect(response.headers.get('X-TypeScript-Types')).toBe(
      `${origin}/ui@main-abcdef1/Action.d.ts`,
    );
  });

  it('serves an exact request that already names a concrete output without an extra hop', async () => {
    const response = await request('/ui@1.2.0/Action.js');
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/javascript; charset=utf-8');
  });

  it('404s an extensionless subpath that maps to no served output', async () => {
    expect((await request('/ui/DoesNotExist')).status).toBe(404);
    expect((await request('/ui@1.2.0/DoesNotExist')).status).toBe(404);
    expect((await request(`/js-toolkit@${fixture.jsToolkitVersion}/missing`)).status).toBe(404);
  });
});

describe('CDN Worker bare package roots', () => {
  it.each(['/ui', '/ui/'])('redirects %s to the latest ui barrel entry', async (path) => {
    const response = await request(path);
    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toBe(`${origin}/ui@2.0.0/index.js`);
    expect(response.headers.get('Cache-Control')).toBe(MUTABLE_CACHE_CONTROL);
    expectCrossOriginHeaders(response);
  });

  it.each(['/ui-mapbox', '/ui-mapbox/'])(
    'redirects %s to the latest ui-mapbox barrel entry',
    async (path) => {
      const response = await request(path);
      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe(`${origin}/ui-mapbox@2.0.0/index.js`);
      expect(response.headers.get('Cache-Control')).toBe(MUTABLE_CACHE_CONTROL);
      expectCrossOriginHeaders(response);
    },
  );

  it.each(['/js-toolkit', '/js-toolkit/'])(
    'redirects %s to the highest js-toolkit index entry',
    async (path) => {
      const response = await request(path);
      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe(
        `${origin}/js-toolkit@${fixture.jsToolkitVersion}/index.js`,
      );
      expect(response.headers.get('Cache-Control')).toBe(MUTABLE_CACHE_CONTROL);
      expectCrossOriginHeaders(response);
    },
  );

  it('returns 404 for bare roots when the package has no eligible release', async () => {
    const original = fixture.bucket.objects.get('versions.json') as NonNullable<
      ReturnType<typeof fixture.bucket.objects.get>
    >;
    fixture.bucket.put(
      'versions.json',
      JSON.stringify({
        schemaVersion: 2,
        packages: {
          ui: { releases: [], channels: [], distTags: {} },
          'ui-mapbox': { releases: [], channels: [], distTags: {} },
          'js-toolkit': { releases: [] },
        },
      }),
    );
    for (const path of [
      '/ui',
      '/ui/',
      '/ui-mapbox',
      '/ui-mapbox/',
      '/js-toolkit',
      '/js-toolkit/',
    ]) {
      expect((await request(path)).status).toBe(404);
    }
    fixture.bucket.objects.set('versions.json', original);
  });
});

describe('CDN Worker package roots with a ref', () => {
  it.each([
    ['/ui@2.0.0', '2.0.0'],
    ['/ui@2.0.0-beta.1', '2.0.0-beta.1'],
    ['/ui@latest', '2.0.0'],
    ['/ui@1', '1.10.0'],
    ['/ui@next', 'main-fedcba9'],
    ['/ui@main', 'main-fedcba9'],
  ])('redirects a ref-carrying ui root %s to its barrel', async (path, exact) => {
    const response = await request(path);
    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toBe(`${origin}/ui@${exact}/index.js`);
    expect(response.headers.get('Cache-Control')).toBe(MUTABLE_CACHE_CONTROL);
    expectCrossOriginHeaders(response);
  });

  it.each([
    ['/ui@2.0.0/', '2.0.0'],
    ['/ui@next/', 'main-fedcba9'],
  ])('redirects a trailing-slash ref-carrying root %s to its barrel', async (path, exact) => {
    const response = await request(path);
    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toBe(`${origin}/ui@${exact}/index.js`);
    expect(response.headers.get('Cache-Control')).toBe(MUTABLE_CACHE_CONTROL);
  });

  it('resolves the ref-carrying redirect target to a served barrel', async () => {
    const response = await request('/ui@next');
    const served = await fetch(new Request(response.headers.get('Location') as string), {
      ASSETS: fixture.bucket,
    });
    expect(served.status).toBe(200);
    expect(served.headers.get('Content-Type')).toBe('text/javascript; charset=utf-8');
    expect(await served.text()).toBe(fixture.files['index.js']);
  });

  it('resolves a ref-carrying ui-mapbox root exactly like ui', async () => {
    const latest = await request('/ui-mapbox@latest');
    expect(latest.status).toBe(307);
    expect(latest.headers.get('Location')).toBe(`${origin}/ui-mapbox@2.0.0/index.js`);

    const channel = await request('/ui-mapbox@main');
    expect(channel.status).toBe(307);
    expect(channel.headers.get('Location')).toBe(`${origin}/ui-mapbox@main-fedcba9/index.js`);
  });

  it('resolves a ref-carrying js-toolkit root by exact semver only', async () => {
    const exact = await request(`/js-toolkit@${fixture.jsToolkitVersion}`);
    expect(exact.status).toBe(307);
    expect(exact.headers.get('Location')).toBe(
      `${origin}/js-toolkit@${fixture.jsToolkitVersion}/index.js`,
    );
    expect(exact.headers.get('Cache-Control')).toBe(MUTABLE_CACHE_CONTROL);
  });

  it('404s a ref that resolves to nothing', async () => {
    // js-toolkit has no channels or dist-tags, and 9.9.9 is unpublished for ui.
    expect((await request('/js-toolkit@main')).status).toBe(404);
    expect((await request('/js-toolkit@latest')).status).toBe(404);
    expect((await request('/ui@9.9.9')).status).toBe(404);
    expect((await request('/ui-mapbox@9.9.9')).status).toBe(404);
  });

  it('404s an explicit @latest root when latest is unset', async () => {
    const original = fixture.bucket.objects.get('versions.json') as NonNullable<
      ReturnType<typeof fixture.bucket.objects.get>
    >;
    fixture.bucket.put(
      'versions.json',
      JSON.stringify({
        schemaVersion: 2,
        packages: {
          ui: { releases: ['1.0.0'], channels: [], distTags: {} },
          'ui-mapbox': { releases: [], channels: [], distTags: {} },
          'js-toolkit': { releases: [] },
        },
      }),
    );
    // With no `latest` tag, both the explicit `@latest` ref and the bare `/ui` root (which also
    // follows `latest`) 404, since ui has no latest tag to resolve.
    expect((await request('/ui@latest')).status).toBe(404);
    expect((await request('/ui')).status).toBe(404);
    fixture.bucket.objects.set('versions.json', original);
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
    '/ui@1.2.0/chunks/',
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

describe('CDN Worker declarations', () => {
  it('serves a declaration with the TypeScript MIME and cross-origin headers', async () => {
    const response = await request('/ui@1.2.0/index.d.ts');
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/typescript; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe(IMMUTABLE_CACHE_CONTROL);
    expectCrossOriginHeaders(response);
    expect(await response.text()).toBe(fixture.files['index.d.ts']);
  });

  it('advertises the sibling declaration of a module via X-TypeScript-Types and exposes it', async () => {
    const response = await request('/ui@1.2.0/index.js');
    expect(response.status).toBe(200);
    expect(response.headers.get('X-TypeScript-Types')).toBe(`${origin}/ui@1.2.0/index.d.ts`);
    expect(response.headers.get('Access-Control-Expose-Headers')).toContain('X-TypeScript-Types');
    expectCrossOriginHeaders(response);
  });

  it('omits X-TypeScript-Types for a module without a sibling declaration', async () => {
    const response = await request(`/ui@1.2.0/${fixture.moduleWithoutDeclaration}`);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/javascript; charset=utf-8');
    expect(response.headers.get('X-TypeScript-Types')).toBeNull();
    expect(response.headers.get('Access-Control-Expose-Headers')).toBeNull();
  });

  it('keeps the declaration hint consistent on HEAD requests', async () => {
    const response = await request('/ui@1.2.0/index.js', { method: 'HEAD' });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('');
    expect(response.headers.get('X-TypeScript-Types')).toBe(`${origin}/ui@1.2.0/index.d.ts`);
    expect(response.headers.get('Access-Control-Expose-Headers')).toContain('X-TypeScript-Types');
  });
});

describe('CDN Worker registry', () => {
  interface Registry {
    packages: {
      ui: { releases: string[]; channels: string[]; distTags: Record<string, string> };
      'ui-mapbox': { releases: string[]; channels: string[]; distTags: Record<string, string> };
      'js-toolkit': { releases: string[] };
    };
    current: { ui: string | null; 'ui-mapbox': string | null; 'js-toolkit': string | null };
    entries: Record<string, string>;
    components: { token: string; package: string; url: string }[];
  }

  function replaceIndex(contents: string): () => void {
    const original = fixture.bucket.objects.get('versions.json') as NonNullable<
      ReturnType<typeof fixture.bucket.objects.get>
    >;
    fixture.bucket.put('versions.json', contents);
    return () => fixture.bucket.objects.set('versions.json', original);
  }

  it('returns the populated registry as JSON with the standard transport headers', async () => {
    const response = await request('/');
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe(MUTABLE_CACHE_CONTROL);
    expectCrossOriginHeaders(response);

    const registry = (await response.json()) as Registry;
    expect(registry.packages.ui.releases).toEqual(fixture.versionsIndex.packages.ui.releases);
    expect(registry.packages.ui.channels).toEqual(fixture.versionsIndex.packages.ui.channels);
    expect(registry.packages.ui.distTags).toEqual(fixture.versionsIndex.packages.ui.distTags);
    expect(registry.packages['ui-mapbox']).toEqual({
      releases: fixture.versionsIndex.packages['ui-mapbox'].releases,
      channels: fixture.versionsIndex.packages['ui-mapbox'].channels,
      distTags: fixture.versionsIndex.packages['ui-mapbox'].distTags,
    });
    expect(registry.packages['js-toolkit'].releases).toEqual([fixture.jsToolkitVersion]);

    expect(registry.current.ui).toBe('2.0.0');
    expect(registry.current['ui-mapbox']).toBe('2.0.0');
    expect(registry.current['js-toolkit']).toBe(fixture.jsToolkitVersion);

    expect(registry.entries.autoload).toBe(`${origin}/ui@2.0.0/autoload.js`);
    expect(registry.entries.index).toBe(`${origin}/ui@2.0.0/index.js`);
    expect(registry.entries['ui-mapbox']).toBe(`${origin}/ui-mapbox@2.0.0/index.js`);
    expect(registry.entries['js-toolkit']).toBe(
      `${origin}/js-toolkit@${fixture.jsToolkitVersion}/index.js`,
    );

    const expectedComponents = [
      ...Object.entries(fixture.build.components).map(([token, component]) => ({
        token,
        package: component.packageName,
        url: `${origin}/ui@2.0.0/${component.subpath}.js`,
      })),
      ...Object.entries(fixture.uiMapboxBuild.components).map(([token, component]) => ({
        token,
        package: component.packageName,
        url: `${origin}/ui-mapbox@2.0.0/${component.subpath}.js`,
      })),
    ].sort((left, right) => left.token.localeCompare(right.token));
    expect(registry.components).toEqual(expectedComponents);

    const action = registry.components.find((component) => component.token === 'Action');
    expect(action).toEqual({
      token: 'Action',
      package: '@studiometa/ui',
      url: `${origin}/ui@2.0.0/Action.js`,
    });
    const mapbox = registry.components.find((component) => component.token === 'MapboxMap');
    expect(mapbox).toEqual({
      token: 'MapboxMap',
      package: '@studiometa/ui-mapbox',
      url: `${origin}/ui-mapbox@2.0.0/MapboxMap.js`,
    });
  });

  it('answers HEAD with the same headers and no body', async () => {
    const response = await request('/', { method: 'HEAD' });
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe(MUTABLE_CACHE_CONTROL);
    expectCrossOriginHeaders(response);
    expect(await response.text()).toBe('');
  });

  it('returns a well-formed empty registry when nothing is published', async () => {
    const restore = replaceIndex(
      JSON.stringify({
        schemaVersion: 2,
        packages: {
          ui: { releases: [], channels: [], distTags: {} },
          'ui-mapbox': { releases: [], channels: [], distTags: {} },
          'js-toolkit': { releases: [] },
        },
      }),
    );
    const registry = (await (await request('/')).json()) as Registry;
    restore();

    expect(registry.packages.ui).toEqual({ releases: [], channels: [], distTags: {} });
    expect(registry.packages['ui-mapbox']).toEqual({ releases: [], channels: [], distTags: {} });
    expect(registry.packages['js-toolkit']).toEqual({ releases: [] });
    expect(registry.current).toEqual({ ui: null, 'ui-mapbox': null, 'js-toolkit': null });
    expect(registry.entries).toEqual({});
    expect(registry.components).toEqual([]);
  });

  it('serves a well-formed empty registry rather than a 502 when the index is unreadable', async () => {
    fixture.bucket.failures.add('versions.json');
    const response = await request('/');
    fixture.bucket.failures.delete('versions.json');

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    const registry = (await response.json()) as Registry;
    expect(registry.current).toEqual({ ui: null, 'ui-mapbox': null, 'js-toolkit': null });
    expect(registry.components).toEqual([]);
    expect(registry.entries).toEqual({});
  });

  // A readable release manifest whose component metadata is malformed must not surface as
  // `package: undefined`, a wrong owner, or an unsafe `…/undefined.js` / `…/../other.js` URL; the
  // invalid build is rejected while the package inventory and current refs still resolve.
  it.each([
    [
      'omits packageName/subpath',
      (component: Record<string, unknown>) => delete component.packageName,
    ],
    [
      'reports an unsupported package name',
      (component: Record<string, unknown>) => {
        component.packageName = 'not-a-package';
      },
    ],
    [
      'uses a traversal subpath',
      (component: Record<string, unknown>) => {
        component.subpath = '../other';
      },
    ],
  ])('drops entries and components when the current build.json %s', async (_label, corrupt) => {
    const key = 'releases/ui/2.0.0/build.json';
    const original = fixture.bucket.objects.get(key) as NonNullable<
      ReturnType<typeof fixture.bucket.objects.get>
    >;
    const malformed = JSON.parse(original.contents) as {
      components: Record<string, Record<string, unknown>>;
    };
    corrupt(malformed.components.Action);
    fixture.bucket.put(key, JSON.stringify(malformed));
    const registry = (await (await request('/')).json()) as Registry;
    fixture.bucket.objects.set(key, original);

    expect(registry.current.ui).toBe('2.0.0');
    expect(registry.packages.ui.releases).toEqual(fixture.versionsIndex.packages.ui.releases);
    // The unreadable ui build drops ui's components and entries, but the intact ui-mapbox tree still
    // contributes its components and barrel entry alongside js-toolkit.
    expect(registry.entries).toEqual({
      'ui-mapbox': `${origin}/ui-mapbox@2.0.0/index.js`,
      'js-toolkit': `${origin}/js-toolkit@${fixture.jsToolkitVersion}/index.js`,
    });
    const expectedMapboxComponents = Object.entries(fixture.uiMapboxBuild.components)
      .map(([token, component]) => ({
        token,
        package: component.packageName,
        url: `${origin}/ui-mapbox@2.0.0/${component.subpath}.js`,
      }))
      .sort((left, right) => left.token.localeCompare(right.token));
    expect(registry.components).toEqual(expectedMapboxComponents);
  });

  it('leaves non-root routes unaffected', async () => {
    const asset = await request('/ui@1.2.0/autoload.js');
    expect(asset.status).toBe(200);
    expect(await asset.text()).toBe(fixture.files['autoload.js']);
    expect((await request('/ui')).status).toBe(307);
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
    fixture.bucket.put('versions.json', '{"schemaVersion":1}');
    expect((await request('/ui@1.2.0/autoload.js')).status).toBe(502);

    // A next tag naming neither a published channel nor a known release is invalid: the index fails
    // to parse and the Worker returns a non-leaking 502. (A next that diverges from main but still
    // names a valid channel or release is now a valid, tolerated shape and is covered elsewhere.)
    const invalidNextTag = structuredClone(
      JSON.parse(original.contents) as {
        packages: { ui: { distTags: { next: string } } };
      },
    );
    invalidNextTag.packages.ui.distTags.next = '9.9.9';
    fixture.bucket.put('versions.json', JSON.stringify(invalidNextTag));
    expect((await request('/ui@main/autoload.js')).status).toBe(502);
    fixture.bucket.objects.set('versions.json', original);
  });

  it('distinguishes missing assets from R2 metadata and asset failures', async () => {
    fixture.bucket.failures.add('releases/ui/1.2.0/build.json');
    expect((await request('/ui@1.2.0/autoload.js')).status).toBe(502);
    fixture.bucket.failures.delete('releases/ui/1.2.0/build.json');

    fixture.bucket.failures.add('releases/ui/1.2.0/autoload.js');
    expect((await request('/ui@1.2.0/autoload.js')).status).toBe(502);
    fixture.bucket.failures.delete('releases/ui/1.2.0/autoload.js');

    fixture.bucket.put('releases/ui/1.2.0/unknown.js', 'uploaded but not published');
    expect((await request('/ui@1.2.0/unknown.js')).status).toBe(404);
    fixture.bucket.objects.delete('releases/ui/1.2.0/unknown.js');
  });
});
