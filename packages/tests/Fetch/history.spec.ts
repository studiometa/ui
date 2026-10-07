import { describe, expect, it, vi } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { mount, settle, waitFor } from '@studiometa/js-toolkit/test';
import { Fetch, FETCH_EVENTS, type FetchEmits, type RestoreRecipe } from '#private/Fetch/Fetch.js';
import { historyCoordinator } from '#private/Fetch/history.js';
import {
  abs,
  back,
  deferClient,
  detailOf,
  forward,
  mountFetch,
  recordHistoryWrites,
  recordFetchEvents,
  redirectedResponse,
  stubClient,
  types,
  useFetchSpecHooks,
} from './helpers.js';

/** A `Fetch` whose `requestInit` holds a value the browser cannot clone. */
class UncloneableFetch extends Fetch {
  static config = {
    name: 'UncloneableFetch',
    options: {
      requestInit: {
        type: Object,
        default: () => ({ cache: 'no-store', onProgress() {} }),
      },
    },
  };
}

registerComponents(Fetch, UncloneableFetch);

useFetchSpecHooks();

/** A server that renders the `#list` region for the `page` of the request. */
function servePages(): ReturnType<typeof stubClient> {
  return stubClient((url) => {
    const { searchParams } = new URL(url);
    const page = searchParams.get('page') ?? searchParams.get('q') ?? 'none';
    return new Response(`<title>Page ${page}</title><div id="list">page ${page}</div>`);
  });
}

/** The text of the `#list` region. */
function list(): string | undefined {
  return document.getElementById('list')?.textContent ?? undefined;
}

/** The path and the query of the address bar. */
function address(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

/** The recipe of the current entry. */
function recipe(): RestoreRecipe | undefined {
  return (window.history.state as { fetch?: RestoreRecipe } | null)?.fetch;
}

/** A recipe as `Fetch` writes it, for entries a spec writes by hand. */
function makeRecipe(overrides: Partial<RestoreRecipe> = {}): RestoreRecipe {
  return {
    component: 'Fetch',
    selector: '[id]',
    mode: 'replace',
    params: {},
    response: 'response.text()',
    headers: {},
    viewTransition: false,
    ...overrides,
  };
}

describe('Fetch history — writing entries', () => {
  it('pushes the destination by default, with the recipe under the `fetch` key', async () => {
    window.history.pushState(null, '', '/projects?page=1');
    servePages();
    await mount(`<div id="list">page 1</div>`);
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="/projects?page=2" data-option-history
        data-option-params='{"view":"fragment"}' data-option-no-view-transition></a>`,
    );
    const writes = recordHistoryWrites();

    await instance.fetch();

    expect(writes.pushed).toEqual([abs('/projects?page=2')]);
    expect(address()).toBe('/projects?page=2');
    expect(recipe()).toMatchObject({ component: 'Fetch', params: { view: 'fragment' } });
  });

  it('replaces the current entry in `replace` mode and keeps the keys of other scripts', async () => {
    window.history.pushState({ other: 1 }, '', '/help');
    servePages();
    const { instance } = await mountFetch(
      `<form data-component="Fetch" action="/help" method="get" data-option-history
        data-option-history-mode="replace" data-option-no-view-transition>
        <input name="q" value="boots">
      </form>`,
    );
    const writes = recordHistoryWrites();

    await instance.fetch();

    expect(writes).toEqual({ pushed: [], replaced: [abs('/help?q=boots')] });
    expect(address()).toBe('/help?q=boots');
    expect(window.history.state).toMatchObject({ other: 1, fetch: { component: 'Fetch' } });
  });

  it('stamps the first entry and keeps the keys of other scripts on both entries', async () => {
    window.history.pushState({ other: 1 }, '', '/projects?page=1');
    servePages();
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="/projects?page=2" data-option-history
        data-option-no-view-transition></a>`,
    );

    await instance.fetch();
    expect(window.history.state).toMatchObject({ other: 1, fetch: { component: 'Fetch' } });

    await back();
    expect(address()).toBe('/projects?page=1');
    expect(window.history.state).toMatchObject({ other: 1, fetch: { component: 'Fetch' } });
  });

  it('replaces a history state that is not an object', async () => {
    window.history.pushState('primitive', '', '/projects?page=1');
    servePages();
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="/projects?page=2" data-option-history
        data-option-no-view-transition></a>`,
    );

    expect(await instance.fetch()).toBe('ok');
    expect(recipe()).toMatchObject({ component: 'Fetch' });
  });

  it('writes the hash of the destination, not the current hash', async () => {
    window.history.pushState(null, '', '/a#x');
    servePages();
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="/b" data-option-history data-option-no-view-transition></a>`,
    );

    await instance.fetch();
    expect(address()).toBe('/b');

    await instance.fetch('/c#y');
    expect(address()).toBe('/c#y');
  });

  it('writes no entry for a cross-origin destination', async () => {
    window.history.pushState(null, '', '/start');
    const { calls } = servePages();
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="https://other.example/page" data-option-history
        data-option-no-view-transition></a>`,
    );
    const writes = recordHistoryWrites();

    expect(await instance.fetch()).toBe('ok');
    expect(calls[0].url).toBe('https://other.example/page');
    expect(writes).toEqual({ pushed: [], replaced: [] });
    expect(address()).toBe('/start');
  });

  it('writes no entry for a POST without a redirect', async () => {
    window.history.pushState(null, '', '/start');
    servePages();
    const { instance } = await mountFetch(
      `<form data-component="Fetch" action="/contact" method="post" data-option-history
        data-option-no-view-transition><input name="a" value="1"></form>`,
    );
    const writes = recordHistoryWrites();

    expect(await instance.fetch()).toBe('ok');
    expect(writes).toEqual({ pushed: [], replaced: [] });
    expect(address()).toBe('/start');
  });

  it('writes the URL a POST was redirected to, as an entry back restores with a GET', async () => {
    window.history.pushState(null, '', '/start');
    const { calls } = stubClient((url, init) =>
      init.method === 'POST'
        ? redirectedResponse('<div id="list">thanks</div>', abs('/thanks?id=7'))
        : new Response('<div id="list">thanks again</div>'),
    );
    await mount(`<div id="list">form</div>`);
    const { instance } = await mountFetch(
      `<form data-component="Fetch" action="/contact" method="post" data-option-history
        data-option-no-view-transition><input name="a" value="1"></form>`,
    );

    await instance.fetch();
    expect(address()).toBe('/thanks?id=7');

    window.history.pushState(null, '', '/elsewhere');
    await back();
    await waitFor(() => list() === 'thanks again');

    expect(calls[1]).toMatchObject({ url: abs('/thanks?id=7'), init: { method: 'GET' } });
    expect(calls[1].init.body).toBeUndefined();
  });

  it('removes the `params` keys from the URL a POST was redirected to', async () => {
    window.history.pushState(null, '', '/start');
    stubClient(() => redirectedResponse('<div></div>', abs('/thanks?id=7&view=fragment')));
    const { instance } = await mountFetch(
      `<form data-component="Fetch" action="/contact" method="post" data-option-history
        data-option-params='{"view":"fragment"}' data-option-no-view-transition></form>`,
    );

    await instance.fetch();

    expect(address()).toBe('/thanks?id=7');
  });

  it('writes no entry for a redirected POST to a `src` endpoint', async () => {
    window.history.pushState(null, '', '/start');
    stubClient(() => redirectedResponse('<div></div>', abs('/apps/thanks')));
    const { instance } = await mountFetch(
      `<form data-component="Fetch" action="/contact" method="post" data-option-history
        data-option-src="/apps/contact" data-option-no-view-transition></form>`,
    );

    await instance.fetch();

    expect(address()).toBe('/start');
  });

  it('writes no entry for a link that posts through `requestInit`', async () => {
    window.history.pushState(null, '', '/start');
    const { calls } = servePages();
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="/cart/add" data-option-history
        data-option-request-init='{"method":"POST"}' data-option-no-view-transition></a>`,
    );

    await instance.fetch();

    expect(calls[0].init.method).toBe('POST');
    expect(address()).toBe('/start');
  });

  it('writes no entry for an element that has no destination of its own', async () => {
    window.history.pushState(null, '', '/start');
    servePages();
    const { instance } = await mountFetch(
      `<div data-component="Fetch" data-option-src="/endpoint" data-option-history
        data-option-no-view-transition></div>`,
    );
    const writes = recordHistoryWrites();

    await instance.fetch();
    expect(writes).toEqual({ pushed: [], replaced: [] });

    await instance.fetch('/named');
    expect(address()).toBe('/named');
  });

  it('ignores a `fetch-update-before` listener that turns history on', async () => {
    window.history.pushState(null, '', '/start');
    servePages();
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="/page" data-option-no-view-transition></a>`,
    );
    root.addEventListener(FETCH_EVENTS.BEFORE_UPDATE, (event) => {
      (event as CustomEvent<FetchEmits['fetch-update-before']>).detail.request.history = 'push';
    });
    const writes = recordHistoryWrites();

    await instance.fetch();

    expect(writes).toEqual({ pushed: [], replaced: [] });
    expect(address()).toBe('/start');
  });

  it('writes an entry when a `fetch-before` listener turns history on', async () => {
    window.history.pushState(null, '', '/start');
    servePages();
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="/page" data-option-no-view-transition></a>`,
    );
    root.addEventListener(FETCH_EVENTS.BEFORE_FETCH, (event) => {
      (event as CustomEvent<FetchEmits['fetch-before']>).detail.request.history = 'push';
    });

    await instance.fetch();

    expect(address()).toBe('/page');
  });

  it('writes an entry although `requestInit` holds a value the browser cannot clone', async () => {
    window.history.pushState(null, '', '/start');
    servePages();
    const { instance } = await mountFetch<UncloneableFetch>(
      `<a data-component="UncloneableFetch" href="/page" data-option-history
        data-option-no-view-transition></a>`,
      'UncloneableFetch',
    );

    expect(await instance.fetch()).toBe('ok');
    expect(address()).toBe('/page');
  });
});

describe('Fetch history — the title', () => {
  it('keeps the title for a request that writes no history', async () => {
    document.title = 'Before';
    servePages();
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="/fragment?page=2" data-option-no-view-transition></a>`,
    );

    await instance.fetch();

    expect(document.title).toBe('Before');
  });

  it('adopts the title on a push and on a restore', async () => {
    window.history.pushState(null, '', '/projects?page=1');
    document.title = 'Page 1';
    servePages();
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="/projects?page=2" data-option-history
        data-option-no-view-transition></a>`,
    );

    await instance.fetch();
    expect(document.title).toBe('Page 2');

    document.title = 'Changed';
    await back();
    await waitFor(() => document.title === 'Page 1');
  });
});

describe('Fetch history — back and forward', () => {
  it('restores the pages of a pagination with `params`', async () => {
    window.history.pushState(null, '', '/projects?page=1');
    const { calls } = servePages();
    await mount(`<div id="list">page 1</div>`);
    const { el } = await mountFetch(
      `<a data-component="Fetch" href="/projects?page=2" data-option-history
        data-option-params='{"view":"fragment"}' data-option-no-view-transition>2</a>`,
    );

    el.click();
    await waitFor(() => list() === 'page 2');
    await back();
    await waitFor(() => list() === 'page 1');
    await forward();
    await waitFor(() => list() === 'page 2');

    expect(calls.map(({ url }) => url)).toEqual([
      abs('/projects?page=2&view=fragment'),
      abs('/projects?page=1&view=fragment'),
      abs('/projects?page=2&view=fragment'),
    ]);
    expect(calls[1].init.headers).toMatchObject({ 'x-triggered-by': 'popstate' });
    expect(address()).toBe('/projects?page=2');
  });

  it('restores a live search with `src`, from the destination of each entry', async () => {
    window.history.pushState(null, '', '/help');
    const { calls } = servePages();
    await mount(`<div id="list">page none</div>`);
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="/help" method="get" data-option-history
        data-option-src="/apps/search?view=fragment" data-option-no-view-transition>
        <input name="q" value="boots">
      </form>`,
    );
    const form = root.querySelector('form')!;
    const input = root.querySelector('input')!;

    form.requestSubmit();
    await waitFor(() => list() === 'page boots');
    input.value = 'shoes';
    form.requestSubmit();
    await waitFor(() => list() === 'page shoes');
    await back();
    await waitFor(() => list() === 'page boots');

    expect(address()).toBe('/help?q=boots');
    expect(calls.map(({ url }) => url)).toEqual([
      abs('/apps/search?view=fragment&q=boots'),
      abs('/apps/search?view=fragment&q=shoes'),
      abs('/apps/search?view=fragment&q=boots'),
    ]);
  });

  it('leaves the search with back in `replace` mode', async () => {
    window.history.pushState(null, '', '/before');
    window.history.pushState(null, '', '/help');
    const { calls } = servePages();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="/help" method="get" data-option-history
        data-option-history-mode="replace" data-option-no-view-transition>
        <input name="q" value="a">
      </form>`,
    );
    const form = root.querySelector('form')!;
    const writes = recordHistoryWrites();

    form.requestSubmit();
    await waitFor(() => calls.length === 1);
    root.querySelector('input')!.value = 'ab';
    form.requestSubmit();
    await waitFor(() => address() === '/help?q=ab');
    expect(writes.pushed).toEqual([]);

    await back();
    await settle();

    expect(address()).toBe('/before');
    expect(calls).toHaveLength(2);
  });

  it('restores with a detached instance when the owner has left the page', async () => {
    window.history.pushState(null, '', '/projects?page=1');
    const { calls } = servePages();
    const root = await mount(`
      <div id="list">
        page 1
        <a data-component="Fetch" id="next" href="/projects?page=2" data-option-history
          data-option-selector="#list" data-option-no-view-transition>2</a>
      </div>
    `);
    root.querySelector('a')!.click();
    await waitFor(() => list() === 'page 2');
    expect(document.getElementById('next')).toBeNull();
    const { events, stop } = recordFetchEvents(document);

    await back();
    await waitFor(() => list() === 'page 1');
    await waitFor(() => types(events).includes(FETCH_EVENTS.AFTER_FETCH));
    stop();

    expect(calls[1].url).toBe(abs('/projects?page=1'));
    expect(types(events)).toEqual([
      FETCH_EVENTS.BEFORE_FETCH,
      FETCH_EVENTS.RESPONSE,
      FETCH_EVENTS.BEFORE_UPDATE,
      FETCH_EVENTS.AFTER_UPDATE,
      FETCH_EVENTS.AFTER_FETCH,
    ]);
    expect(detailOf(events, FETCH_EVENTS.AFTER_FETCH)).toMatchObject({
      outcome: 'ok',
      request: { history: false, destination: abs('/projects?page=1') },
    });
  });

  it('restores through the mounted instance that replaced the owner, with the recipe of the entry', async () => {
    window.history.pushState(null, '', '/projects?page=1');
    const { calls } = stubClient((url) => {
      const page = new URL(url).searchParams.get('page');
      return new Response(`
        <div id="list">page ${page}</div>
        <div id="nav">
          <a data-component="Fetch" id="next" href="/projects?page=3" data-option-history
            data-option-selector="#other" data-option-params='{"view":"other"}'
            data-option-no-view-transition>3</a>
        </div>
      `);
    });
    const root = await mount(`
      <div id="list">page 1</div>
      <div id="nav">
        <a data-component="Fetch" id="next" href="/projects?page=2" data-option-history
          data-option-selector="#list, #nav" data-option-params='{"view":"fragment"}'
          data-option-no-view-transition>2</a>
      </div>
    `);
    root.querySelector('a')!.click();
    await waitFor(() => list() === 'page 2');
    const replaced = await waitFor(() => {
      const next = document.getElementById('next');
      return next && getInstance<Fetch>(next, 'Fetch')?.$isMounted ? next : null;
    });
    const { events } = recordFetchEvents(replaced);

    await back();
    await waitFor(() => list() === 'page 1');

    expect(calls[1].url).toBe(abs('/projects?page=1&view=fragment'));
    expect(types(events)).toContain(FETCH_EVENTS.BEFORE_FETCH);
    expect(detailOf(events, FETCH_EVENTS.BEFORE_FETCH)).toMatchObject({
      instance: getInstance(replaced, 'Fetch'),
    });
  });

  it('sends one request for one popstate with two `Fetch` elements that write history', async () => {
    window.history.pushState(null, '', '/projects?page=1');
    const { calls } = servePages();
    await mount(`<div id="list">page 1</div>`);
    const { root } = await mountFetch(`
      <div>
        <a data-component="Fetch" href="/projects?page=2" data-option-history data-option-no-view-transition>2</a>
        <form data-component="Fetch" action="/projects" data-option-history data-option-no-view-transition>
          <input name="page" value="3">
        </form>
      </div>
    `);

    root.querySelector('a')!.click();
    await waitFor(() => list() === 'page 2');
    await back();
    await waitFor(() => list() === 'page 1');
    await settle();

    expect(calls).toHaveLength(2);
  });

  it('ignores an entry that another script wrote', async () => {
    window.history.pushState(null, '', '/projects?page=1');
    const { calls } = servePages();
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="/projects?page=2" data-option-history
        data-option-no-view-transition></a>`,
    );
    await instance.fetch();
    window.history.pushState({ other: 1 }, '', '/projects?page=2#map');
    window.history.pushState(null, '', '/elsewhere');

    await back();
    await settle();
    await back();
    await settle();

    expect(address()).toBe('/projects?page=2');
    expect(calls).toHaveLength(2);
    expect(calls[1].url).toBe(abs('/projects?page=2'));
  });

  it('restores after a reload, once a `Fetch` with history has mounted', async () => {
    window.history.pushState(
      { fetch: makeRecipe({ params: { view: 'fragment' } }) },
      '',
      '/projects?page=4',
    );
    const { calls } = servePages();
    await mount(`<div id="list">stale</div>`);
    await mountFetch(`<a data-component="Fetch" href="/projects" data-option-history></a>`);

    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    await waitFor(() => list() === 'page 4');

    expect(calls.map(({ url }) => url)).toEqual([abs('/projects?page=4&view=fragment')]);
  });

  it('reloads the page for an entry that no class on the page can restore', async () => {
    const reload = vi.spyOn(historyCoordinator, 'reload').mockImplementation(() => {});
    window.history.pushState({ fetch: makeRecipe({ component: 'Unknown' }) }, '', '/x');
    const { spy } = servePages();
    await mountFetch(`<a data-component="Fetch" href="/projects" data-option-history></a>`);

    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    await settle();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(spy).not.toHaveBeenCalled();
    reload.mockRestore();
  });

  it('restores a relative `src` to the endpoint it named when the entry was written', async () => {
    window.history.pushState(null, '', '/shop/help');
    const { calls } = servePages();
    const { instance } = await mountFetch(
      `<form data-component="Fetch" action="/shop/help" method="get" data-option-history
        data-option-src="search?view=fragment" data-option-no-view-transition>
        <input name="q" value="boots">
      </form>`,
    );

    await instance.fetch();
    await instance.fetch('/other/path/help?q=shoes');
    // The address bar is now in another directory, so the relative `src`
    // resolves elsewhere for the next request, as any relative URL does.
    await instance.fetch('/other/path/help?q=socks');
    await back();
    await waitFor(() => calls.length === 4);

    expect(calls.map(({ url }) => url)).toEqual([
      abs('/shop/search?view=fragment&q=boots'),
      abs('/shop/search?view=fragment&q=shoes'),
      abs('/other/path/search?view=fragment&q=socks'),
      abs('/shop/search?view=fragment&q=shoes'),
    ]);
  });

  it('restores a `formaction` entry to the same request as the navigation', async () => {
    window.history.pushState(null, '', '/start');
    const { calls } = servePages();
    const { root, instance } = await mountFetch(
      `<form data-component="Fetch" action="/search" method="get" data-option-history
        data-option-src="/apps/search" data-option-params='{"view":"fragment"}'
        data-option-no-view-transition>
        <input name="q" value="boots">
        <button type="submit" formaction="/elsewhere">Go</button>
      </form>`,
    );
    const form = root.querySelector('form')!;

    form.requestSubmit(form.querySelector('button'));
    await waitFor(() => calls.length === 1);
    await waitFor(() => address() === '/elsewhere?q=boots');
    await instance.fetch('/search?q=next');
    await back();
    await waitFor(() => calls.length === 3);

    expect(calls[0].url).toBe(abs('/elsewhere?q=boots'));
    expect(calls[2].url).toBe(calls[0].url);
  });
});

describe('Fetch history — one navigation at a time, page-wide', () => {
  it('aborts the navigation of another instance, which then writes nothing', async () => {
    window.history.pushState(null, '', '/start');
    const { calls } = deferClient();
    await mount(`<div id="list">start</div>`);
    const { root } = await mountFetch(`
      <div>
        <a data-component="Fetch" id="a" href="/a" data-option-history data-option-no-view-transition></a>
        <a data-component="Fetch" id="b" href="/b" data-option-history data-option-no-view-transition></a>
      </div>
    `);
    const a = getInstance<Fetch>(root.querySelector('#a')!, 'Fetch')!;
    const b = getInstance<Fetch>(root.querySelector('#b')!, 'Fetch')!;
    const { events } = recordFetchEvents(root.querySelector('#a')!);
    const writes = recordHistoryWrites();

    const first = a.fetch();
    await waitFor(() => calls.length === 1);
    const second = b.fetch();
    await waitFor(() => calls.length === 2);
    calls[0].resolve(new Response('<div id="list">a</div>'));
    calls[1].resolve(new Response('<div id="list">b</div>'));

    expect(await first).toBe('aborted');
    expect(await second).toBe('ok');
    expect(types(events)).toEqual([
      FETCH_EVENTS.BEFORE_FETCH,
      FETCH_EVENTS.ABORT,
      FETCH_EVENTS.AFTER_FETCH,
    ]);
    expect(list()).toBe('b');
    expect(address()).toBe('/b');
    expect(writes.pushed).toEqual([abs('/b')]);
  });

  it('aborts a navigation in flight on popstate', async () => {
    window.history.pushState(null, '', '/projects?page=1');
    servePages();
    await mount(`<div id="list">page 1</div>`);
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="/projects?page=2" data-option-history
        data-option-no-view-transition></a>`,
    );
    await instance.fetch();
    const { calls } = deferClient();

    const navigation = instance.fetch('/projects?page=3');
    await waitFor(() => calls.length === 1);
    await back();
    await waitFor(() => calls.length === 2);
    calls[1].resolve(new Response('<div id="list">page 1 again</div>'));

    expect(await navigation).toBe('aborted');
    await waitFor(() => list() === 'page 1 again');
    expect(address()).toBe('/projects?page=1');
  });

  it('aborts a restore in flight on a new navigation', async () => {
    window.history.pushState(null, '', '/projects?page=1');
    servePages();
    await mount(`<div id="list">page 1</div>`);
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="/projects?page=2" data-option-history
        data-option-no-view-transition></a>`,
    );
    await instance.fetch();
    const { calls } = deferClient();
    const { events, stop } = recordFetchEvents(document);

    await back();
    await waitFor(() => calls.length === 1);
    const navigation = instance.fetch('/projects?page=3');
    await waitFor(() => calls.length === 2);
    calls[0].resolve(new Response('<div id="list">restored</div>'));
    calls[1].resolve(new Response('<div id="list">page 3</div>'));

    expect(await navigation).toBe('ok');
    stop();
    expect(list()).toBe('page 3');
    expect(address()).toBe('/projects?page=3');
    expect(
      events
        .filter(({ type }) => type === FETCH_EVENTS.AFTER_FETCH)
        .map(({ detail }) => (detail as FetchEmits['fetch-after']).outcome),
    ).toEqual(['aborted', 'ok']);
  });

  it('applies only the last of two quick popstates', async () => {
    window.history.pushState(null, '', '/projects?page=1');
    servePages();
    await mount(`<div id="list">page 1</div>`);
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="/projects?page=2" data-option-history
        data-option-no-view-transition></a>`,
    );
    await instance.fetch();
    await instance.fetch('/projects?page=3');
    const { calls } = deferClient();

    await back();
    await back();
    await waitFor(() => calls.length === 2);
    calls[1].resolve(new Response('<div id="list">page 1 again</div>'));
    await waitFor(() => list() === 'page 1 again');
    calls[0].resolve(new Response('<div id="list">page 2 again</div>'));
    await settle();

    expect(calls.map(({ url }) => url)).toEqual([abs('/projects?page=2'), abs('/projects?page=1')]);
    expect(calls[0].init.signal?.aborted).toBe(true);
    expect(list()).toBe('page 1 again');
  });
});
