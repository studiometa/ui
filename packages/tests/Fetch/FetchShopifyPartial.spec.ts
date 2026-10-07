import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerComponents } from '@studiometa/js-toolkit';
import { mount, settle, waitFor } from '@studiometa/js-toolkit/test';
import { FETCH_EVENTS, type FetchEmits } from '#private/Fetch/Fetch.js';
import { FetchShopifyPartial } from '#private/Fetch/FetchShopifyPartial.js';
import {
  abs,
  back,
  detailOf,
  mountFetch,
  recordFetchEvents,
  recordHistoryWrites,
  stubClient,
  types,
  useFetchSpecHooks,
} from './helpers.js';

registerComponents(FetchShopifyPartial);

useFetchSpecHooks();

const originalLoadPartialsModule = FetchShopifyPartial.loadPartialsModule;

afterEach(() => {
  FetchShopifyPartial.loadPartialsModule = originalLoadPartialsModule;
});

/** Mount one `FetchShopifyPartial` from markup. */
function mountPartial(html: string): ReturnType<typeof mountFetch<FetchShopifyPartial>> {
  return mountFetch<FetchShopifyPartial>(html, 'FetchShopifyPartial');
}

/** The partials API of a fake `@shopify/partial-rendering`. */
interface FakePartials {
  fetch: ReturnType<typeof vi.fn>;
  apply: ReturnType<typeof vi.fn>;
}

/**
 * Install a fake partials module. Its update names the page it was fetched
 * for, and applying it writes that page into `#main`.
 */
function stubPartials(overrides: Partial<FakePartials> = {}): FakePartials {
  const api: FakePartials = {
    fetch: vi.fn(async (...args: unknown[]) => {
      const { url } = args.at(-1) as { url: string };
      return { page: new URL(url).searchParams.get('page') };
    }),
    apply: vi.fn((update: { page: string | null }) => {
      const main = document.getElementById('main');
      if (main) {
        main.textContent = `main ${update.page}`;
      }
    }),
    ...overrides,
  };
  FetchShopifyPartial.loadPartialsModule = async () => ({ partials: api });
  return api;
}

describe('FetchShopifyPartial', () => {
  it('uses the inherited transport when no partials are configured', async () => {
    const { spy } = stubClient();
    const { root, instance } = await mountPartial(
      `<a data-component="FetchShopifyPartial" href="/page"></a>`,
    );
    const { events } = recordFetchEvents(root);

    expect(await instance.fetch()).toBe('ok');

    expect(spy).toHaveBeenCalledOnce();
    expect(types(events)).toContain(FETCH_EVENTS.RESPONSE);
  });

  it('loads and applies through partials, with the inherited lifecycle and no `fetch-response`', async () => {
    const { spy } = stubClient();
    const partials = stubPartials();
    await mount(`<div id="main">main 1</div>`);
    const { root, instance } = await mountPartial(
      `<a data-component="FetchShopifyPartial" href="/page?page=2" data-option-partials="main, header"></a>`,
    );
    const { events } = recordFetchEvents(root);

    expect(await instance.fetch()).toBe('ok');

    expect(spy).not.toHaveBeenCalled();
    expect(partials.fetch).toHaveBeenCalledWith('main', 'header', {
      url: abs('/page?page=2'),
      signal: expect.any(AbortSignal),
    });
    expect(partials.apply).toHaveBeenCalledWith({ page: '2' });
    expect(document.getElementById('main')?.textContent).toBe('main 2');
    expect(types(events)).toEqual([
      FETCH_EVENTS.BEFORE_FETCH,
      FETCH_EVENTS.BEFORE_UPDATE,
      FETCH_EVENTS.AFTER_UPDATE,
      FETCH_EVENTS.AFTER_FETCH,
    ]);
    expect(
      detailOf<FetchEmits['fetch-update-before']>(events, FETCH_EVENTS.BEFORE_UPDATE).content,
    ).toEqual({ page: '2' });
    expect(detailOf(events, FETCH_EVENTS.AFTER_FETCH)).toMatchObject({ outcome: 'ok' });
  });

  it('does not claim a view transition around `partials.apply()`, which runs its own', async () => {
    stubPartials();
    const { root, instance } = await mountPartial(
      `<a data-component="FetchShopifyPartial" href="/page" data-option-partials="main"></a>`,
    );
    const runners: unknown[] = [];
    root.addEventListener('js-toolkit:dom:update', (event) => {
      runners.push((event as CustomEvent<{ request: unknown }>).detail.request);
    });
    const startViewTransition = vi.spyOn(document, 'startViewTransition');

    await instance.fetch();

    expect(runners).toHaveLength(1);
    expect(startViewTransition).not.toHaveBeenCalled();
    startViewTransition.mockRestore();
  });

  it('uses the inherited transport when the module does not resolve', async () => {
    const { spy } = stubClient();
    FetchShopifyPartial.loadPartialsModule = async () => {
      throw new Error('not installed');
    };
    const { instance } = await mountPartial(
      `<a data-component="FetchShopifyPartial" href="/page" data-option-partials="main"></a>`,
    );

    expect(await instance.fetch()).toBe('ok');
    expect(spy).toHaveBeenCalledOnce();
  });

  it.each([
    [
      'adds a header',
      (request: { headers: Record<string, string> }) => (request.headers['x-custom'] = '1'),
    ],
    [
      'adds a body',
      (request: { body?: unknown; method: string }) => {
        request.method = 'POST';
        request.body = 'a=1';
      },
    ],
  ])(
    'uses the inherited transport, with `fetch-response`, when a `fetch-before` listener %s',
    async (_label, change) => {
      const { spy } = stubClient();
      const partials = stubPartials();
      const { root, instance } = await mountPartial(
        `<a data-component="FetchShopifyPartial" href="/page" data-option-partials="main"></a>`,
      );
      root.addEventListener(FETCH_EVENTS.BEFORE_FETCH, (event) => {
        change((event as CustomEvent<FetchEmits['fetch-before']>).detail.request as never);
      });
      const { events } = recordFetchEvents(root);

      expect(await instance.fetch()).toBe('ok');

      expect(partials.fetch).not.toHaveBeenCalled();
      expect(spy).toHaveBeenCalledOnce();
      expect(types(events)).toContain(FETCH_EVENTS.RESPONSE);
    },
  );

  it('uses the inherited transport for a `requestInit` it cannot express', async () => {
    const { spy } = stubClient();
    const partials = stubPartials();
    const { instance } = await mountPartial(
      `<a data-component="FetchShopifyPartial" href="/page" data-option-partials="main"
        data-option-request-init='{"credentials":"include"}'></a>`,
    );

    await instance.fetch();

    expect(partials.fetch).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledOnce();
  });

  it.each(['accept', 'x-requested-by'])(
    'uses the inherited transport for an `%s` header of the `headers` option',
    async (name) => {
      const { spy } = stubClient();
      const partials = stubPartials();
      const { instance } = await mountPartial(
        `<a data-component="FetchShopifyPartial" href="/page" data-option-partials="main"
          data-option-headers='{"${name}":"theme"}'></a>`,
      );

      await instance.fetch();

      expect(partials.fetch).not.toHaveBeenCalled();
      expect(spy.mock.calls[0][1].headers).toMatchObject({ [name]: 'theme' });
    },
  );

  it('reports a rejected `partials.apply()` as `fetch-error`, then `fetch-after`', async () => {
    const failure = new Error('apply failed');
    stubPartials({ apply: vi.fn(() => Promise.reject(failure)) });
    const { root, instance } = await mountPartial(
      `<a data-component="FetchShopifyPartial" href="/page" data-option-partials="main"></a>`,
    );
    const { events } = recordFetchEvents(root);

    expect(await instance.fetch()).toBe('error');

    expect(types(events).slice(-2)).toEqual([FETCH_EVENTS.ERROR, FETCH_EVENTS.AFTER_FETCH]);
    expect(detailOf(events, FETCH_EVENTS.ERROR)).toMatchObject({ error: failure });
    expect(types(events)).not.toContain(FETCH_EVENTS.AFTER_UPDATE);
  });

  it('never applies a superseded partials update', async () => {
    const releases: ((update: unknown) => void)[] = [];
    const partials = stubPartials({
      fetch: vi.fn(() => new Promise((resolve) => releases.push(resolve))),
    });
    const { instance } = await mountPartial(
      `<a data-component="FetchShopifyPartial" href="/page" data-option-partials="main"></a>`,
    );

    const first = instance.fetch('/one');
    await waitFor(() => releases.length === 1);
    const second = instance.fetch('/two');
    await waitFor(() => releases.length === 2);
    releases[1]({ page: 'two' });
    releases[0]({ page: 'one' });

    expect(await Promise.all([first, second])).toEqual(['aborted', 'ok']);
    expect(partials.apply.mock.calls).toEqual([[{ page: 'two' }]]);
  });

  it('memoises the resolved partials module across calls', async () => {
    const loadSpy = vi.fn(async () => ({
      partials: { fetch: vi.fn(async () => ({})), apply: vi.fn() },
    }));
    FetchShopifyPartial.loadPartialsModule = loadSpy;
    const { instance } = await mountPartial(
      `<a data-component="FetchShopifyPartial" href="/page" data-option-partials="main"></a>`,
    );

    await instance.fetch();
    await instance.fetch();

    expect(loadSpy).toHaveBeenCalledOnce();
  });
});

describe('FetchShopifyPartial — history', () => {
  it('pushes the destination, not the `src` it requested', async () => {
    window.history.pushState(null, '', '/start');
    const partials = stubPartials();
    const { el } = await mountPartial(
      `<a data-component="FetchShopifyPartial" href="/projects?page=2"
        data-option-src="/apps/projects" data-option-partials="main" data-option-history></a>`,
    );
    const writes = recordHistoryWrites();

    el.click();
    await waitFor(() => writes.pushed.length === 1);

    expect(partials.fetch).toHaveBeenCalledWith('main', {
      url: abs('/apps/projects?page=2'),
      signal: expect.any(AbortSignal),
    });
    expect(writes.pushed).toEqual([abs('/projects?page=2')]);
  });

  it('restores through partials with a live owner', async () => {
    window.history.pushState(null, '', '/projects?page=1');
    const partials = stubPartials();
    await mount(`<div id="main">main 1</div>`);
    const { instance } = await mountPartial(
      `<a data-component="FetchShopifyPartial" id="pager" href="/projects?page=2"
        data-option-partials="main" data-option-history></a>`,
    );

    await instance.fetch();
    expect(document.getElementById('main')?.textContent).toBe('main 2');
    await back();
    await waitFor(() => document.getElementById('main')?.textContent === 'main 1');

    expect(partials.fetch).toHaveBeenLastCalledWith('main', {
      url: abs('/projects?page=1'),
      signal: expect.any(AbortSignal),
    });
  });

  it('restores through partials with no owner left on the page', async () => {
    window.history.pushState(null, '', '/projects?page=1');
    const partials = stubPartials({
      apply: vi.fn((update: { page: string | null }) => {
        document.getElementById('main')!.innerHTML = `main ${update.page}`;
      }),
    });
    const root = await mount(`
      <div id="main">
        main 1
        <a data-component="FetchShopifyPartial" href="/projects?page=2"
          data-option-partials="main" data-option-history>2</a>
      </div>
    `);

    root.querySelector('a')!.click();
    await waitFor(() => document.getElementById('main')?.textContent === 'main 2');
    await settle();
    expect(document.querySelector('[data-component="FetchShopifyPartial"]')).toBeNull();
    await back();
    await waitFor(() => document.getElementById('main')?.textContent === 'main 1');

    expect(partials.fetch).toHaveBeenCalledTimes(2);
  });
});
