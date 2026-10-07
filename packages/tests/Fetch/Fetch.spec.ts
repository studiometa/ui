import { describe, expect, it } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { captureDiagnostics, mount, settle, waitFor } from '@studiometa/js-toolkit/test';
import { Action } from '#private/Action/Action.js';
import { Track } from '#private/Track/Track.js';
import {
  Fetch,
  FETCH_EVENTS,
  type FetchEmits,
  type FetchRequest,
  type RestoreRecipe,
} from '#private/Fetch/Fetch.js';
import {
  abs,
  allowNativeSubmit,
  deferClient,
  detailOf,
  mountFetch,
  recordFetchEvents,
  recordHistoryWrites,
  stubClient,
  stubViewTransition,
  types,
  useFetchSpecHooks,
} from './helpers.js';

declare global {
  interface Window {
    __fetchScriptRuns?: number;
  }
}

/** A `Fetch` whose DOM change throws, as a broken subclass would. */
class FailingApplyFetch extends Fetch {
  static config = { name: 'FailingApplyFetch' };

  async __apply(): Promise<Document | undefined> {
    throw new Error('apply failed');
  }
}

registerComponents(Fetch, FailingApplyFetch, Action, Track);

useFetchSpecHooks();

/** Read the request of the next `fetch-before` that reaches `target`. */
function nextRequest(target: EventTarget): Promise<FetchRequest> {
  return new Promise((resolve) => {
    target.addEventListener(
      FETCH_EVENTS.BEFORE_FETCH,
      (event) => resolve((event as CustomEvent<FetchEmits['fetch-before']>).detail.request),
      { once: true },
    );
  });
}

describe('Fetch — the request', () => {
  it('describes a link navigation in `fetch-before`', async () => {
    stubClient();
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="/projects?page=2"></a>`,
    );
    const request = nextRequest(root);

    await instance.fetch();

    expect(await request).toMatchObject({
      url: abs('/projects?page=2'),
      destination: abs('/projects?page=2'),
      method: 'GET',
      history: false,
      body: undefined,
    });
  });

  it('merges the headers of the option, the refs and `requestInit` with lower-case names', async () => {
    stubClient();
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="/page"
        data-option-request-init='{"headers":{"X-From-Init":"init"},"credentials":"include"}'
        data-option-headers='{"X-From-Headers":"headers"}'>
        <input type="hidden" data-ref="headers[]" data-name="X-From-Ref" value="ref">
        <input type="hidden" data-ref="headers[]" data-name="x-empty" value="">
      </a>`,
    );
    const request = nextRequest(root);

    await instance.fetch();
    const { headers } = await request;

    expect(headers['x-from-init']).toBe('init');
    expect(headers['x-from-headers']).toBe('headers');
    expect(headers['x-from-ref']).toBe('ref');
    expect(headers).not.toHaveProperty('x-empty');
    expect(headers['user-agent']).toContain('@studiometa/ui/Fetch');
  });

  it('sends the method, headers, body and the other `requestInit` keys to the client', async () => {
    const { calls } = stubClient();
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="/page"
        data-option-request-init='{"credentials":"include","headers":{"x-a":"1"}}'></a>`,
    );

    await instance.fetch();

    expect(calls[0].init).toMatchObject({
      credentials: 'include',
      method: 'GET',
      headers: expect.objectContaining({ 'x-a': '1' }),
    });
    expect(calls[0].init.signal).toBeInstanceOf(AbortSignal);
  });

  it('adds the `params` option to the request and not to the destination', async () => {
    const { calls } = stubClient();
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="/projects?page=2"
        data-option-params='{"view":"fragment","limit":12}'></a>`,
    );
    const request = nextRequest(root);

    await instance.fetch();

    expect(calls[0].url).toBe(abs('/projects?page=2&view=fragment&limit=12'));
    expect((await request).destination).toBe(abs('/projects?page=2'));
  });

  it('requests the `src` endpoint with the query of the link folded on', async () => {
    const { calls } = stubClient();
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="/help?q=shoes" data-option-src="/apps/search?view=fragment"></a>`,
    );

    await instance.fetch();

    expect(calls[0].url).toBe(abs('/apps/search?view=fragment&q=shoes'));
  });

  it('does not fold the query of the page into `src` for an element that is neither a link nor a form', async () => {
    window.history.replaceState(null, '', '?unrelated=1');
    const { calls } = stubClient();
    const { instance } = await mountFetch(
      `<div data-component="Fetch" data-option-src="/endpoint?a=1"></div>`,
    );

    await instance.fetch();

    expect(calls[0].url).toBe(abs('/endpoint?a=1'));
  });

  it('resolves a destination given to `fetch()` against the page', async () => {
    const { calls } = stubClient();
    const { instance } = await mountFetch(`<a data-component="Fetch" href="/from-href"></a>`);

    await instance.fetch('/relative?a=1');

    expect(calls[0].url).toBe(abs('/relative?a=1'));
  });

  it('seeds the method and the body of a link from `requestInit`', async () => {
    const { calls } = stubClient();
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="/cart/add"
        data-option-request-init='{"method":"post","body":"id=1"}'></a>`,
    );
    const request = nextRequest(root);

    await instance.fetch();

    expect((await request).method).toBe('POST');
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.body).toBe('id=1');
  });

  it('sends the request as a `fetch-before` listener changed it', async () => {
    const { calls } = stubClient();
    const { root, instance } = await mountFetch(`<a data-component="Fetch" href="/page"></a>`);
    root.addEventListener(
      FETCH_EVENTS.BEFORE_FETCH,
      (event) => {
        const { request } = (event as CustomEvent<FetchEmits['fetch-before']>).detail;
        request.url = abs('/changed?x=1');
        request.method = 'post';
        request.headers['X-Added'] = 'yes';
        request.body = 'raw';
      },
      { once: true },
    );

    await instance.fetch();

    expect(calls[0].url).toBe(abs('/changed?x=1'));
    expect(calls[0].init).toMatchObject({
      method: 'POST',
      body: 'raw',
      headers: expect.objectContaining({ 'x-added': 'yes' }),
    });
  });

  it('gives the `response` expression the `response`, `request` and `self` bindings', async () => {
    stubClient(() => new Response('body'));
    await mount(`<div id="target">old</div>`);
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="/page?a=1" data-option-no-view-transition
        data-option-response="response.text().then((text) => '&lt;div id=&quot;target&quot;&gt;' + [text, request.method, new URL(request.url).search, self === window].join(' ') + '&lt;/div&gt;')"></a>`,
    );

    await instance.fetch();

    expect(document.getElementById('target')?.textContent).toBe('body GET ?a=1 true');
  });

  it('ends with an error when the request cannot be built', async () => {
    const { spy } = stubClient();
    const { root, instance } = await mountFetch(
      `<div data-component="Fetch" data-option-src="http://["></div>`,
    );
    const { events } = recordFetchEvents(root);

    const outcome = await instance.fetch();

    expect(outcome).toBe('error');
    expect(spy).not.toHaveBeenCalled();
    expect(types(events)).toEqual([FETCH_EVENTS.ERROR, FETCH_EVENTS.AFTER_FETCH]);
    expect(detailOf(events, FETCH_EVENTS.ERROR).request).toBeUndefined();
    expect(detailOf(events, FETCH_EVENTS.AFTER_FETCH)).toMatchObject({ outcome: 'error' });
  });
});

describe('Fetch — lifecycle events', () => {
  it('emits the lifecycle in order and resolves `ok` once the DOM has changed', async () => {
    stubClient(() => new Response('<div id="target">new</div>'));
    await mount(`<div id="target">old</div>`);
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="/page" data-option-no-view-transition></a>`,
    );
    const { events } = recordFetchEvents(root);

    const outcome = await instance.fetch();

    expect(outcome).toBe('ok');
    expect(document.getElementById('target')?.textContent).toBe('new');
    expect(types(events)).toEqual([
      FETCH_EVENTS.BEFORE_FETCH,
      FETCH_EVENTS.RESPONSE,
      FETCH_EVENTS.BEFORE_UPDATE,
      FETCH_EVENTS.AFTER_UPDATE,
      FETCH_EVENTS.AFTER_FETCH,
    ]);
    expect(detailOf(events, FETCH_EVENTS.AFTER_FETCH)).toMatchObject({
      instance,
      outcome: 'ok',
      request: { url: abs('/page') },
    });
  });

  it('declares no `fetch-fetch` or `fetch-update` event, and dispatches none', async () => {
    stubClient();
    const { root, instance } = await mountFetch(`<a data-component="Fetch" href="/page"></a>`);
    const seen: string[] = [];
    for (const type of ['fetch-fetch', 'fetch-update']) {
      root.addEventListener(type, () => seen.push(type));
    }

    await instance.fetch();

    expect(Object.keys(FETCH_EVENTS)).not.toContain('FETCH');
    expect(Object.keys(FETCH_EVENTS)).not.toContain('UPDATE');
    expect(seen).toEqual([]);
  });

  it('describes the response as plain data, with lower-case header names', async () => {
    stubClient(
      () =>
        new Response('<div id="fetch-default">new</div>', {
          status: 200,
          statusText: 'OK',
          headers: { 'X-Search-Result-Count': '42' },
        }),
    );
    const { root, instance } = await mountFetch(`<a data-component="Fetch" href="/page"></a>`);
    const { events } = recordFetchEvents(root);

    await instance.fetch();

    const { response } = detailOf<FetchEmits['fetch-response']>(events, FETCH_EVENTS.RESPONSE);
    expect(response).not.toBeInstanceOf(Response);
    expect(response).toMatchObject({
      status: 200,
      statusText: 'OK',
      ok: true,
      redirected: false,
      headers: { 'x-search-result-count': '42' },
    });
    expect(
      detailOf<FetchEmits['fetch-update-after']>(events, FETCH_EVENTS.AFTER_UPDATE).response
        ?.headers['x-search-result-count'],
    ).toBe('42');
  });

  it('reports a response that is not ok as `fetch-response`, then `fetch-error`', async () => {
    stubClient(() => new Response('nope', { status: 404, headers: { 'X-Reason': 'gone' } }));
    const { root, instance } = await mountFetch(`<a data-component="Fetch" href="/page"></a>`);
    const { events } = recordFetchEvents(root);

    const outcome = await instance.fetch();

    expect(outcome).toBe('error');
    expect(types(events)).toEqual([
      FETCH_EVENTS.BEFORE_FETCH,
      FETCH_EVENTS.RESPONSE,
      FETCH_EVENTS.ERROR,
      FETCH_EVENTS.AFTER_FETCH,
    ]);
    const error = detailOf<FetchEmits['fetch-error']>(events, FETCH_EVENTS.ERROR);
    expect((error.error as Error).message).toContain('404');
    expect(error.response).toMatchObject({ status: 404, headers: { 'x-reason': 'gone' } });
    expect(error.request?.url).toBe(abs('/page'));
    expect(detailOf(events, FETCH_EVENTS.AFTER_FETCH)).toMatchObject({ outcome: 'error' });
  });

  it('reports a response that cannot be parsed the same way', async () => {
    stubClient(() => new Response('not json'));
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="/page" data-option-response="response.json()"></a>`,
    );
    const { events } = recordFetchEvents(root);

    const outcome = await instance.fetch();

    expect(outcome).toBe('error');
    expect(types(events)).toEqual([
      FETCH_EVENTS.BEFORE_FETCH,
      FETCH_EVENTS.RESPONSE,
      FETCH_EVENTS.ERROR,
      FETCH_EVENTS.AFTER_FETCH,
    ]);
    expect(detailOf<FetchEmits['fetch-error']>(events, FETCH_EVENTS.ERROR).response?.status).toBe(
      200,
    );
  });

  it('reports a network error with no response, and never rejects', async () => {
    stubClient(() => {
      throw new Error('network down');
    });
    const { root, instance } = await mountFetch(`<a data-component="Fetch" href="/page"></a>`);
    const { events } = recordFetchEvents(root);

    await expect(instance.fetch()).resolves.toBe('error');

    expect(types(events)).toEqual([
      FETCH_EVENTS.BEFORE_FETCH,
      FETCH_EVENTS.ERROR,
      FETCH_EVENTS.AFTER_FETCH,
    ]);
    const error = detailOf<FetchEmits['fetch-error']>(events, FETCH_EVENTS.ERROR);
    expect((error.error as Error).message).toBe('network down');
    expect(error.response).toBeUndefined();
  });

  it('sends nothing for a cancelled `fetch-before` and ends with `aborted` alone', async () => {
    const { spy } = stubClient();
    const { root, instance } = await mountFetch(`<a data-component="Fetch" href="/page"></a>`);
    root.addEventListener(FETCH_EVENTS.BEFORE_FETCH, (event) => event.preventDefault());
    const { events } = recordFetchEvents(root);

    const outcome = await instance.fetch();

    expect(outcome).toBe('aborted');
    expect(spy).not.toHaveBeenCalled();
    expect(types(events)).toEqual([FETCH_EVENTS.BEFORE_FETCH, FETCH_EVENTS.AFTER_FETCH]);
    expect(detailOf(events, FETCH_EVENTS.AFTER_FETCH)).toMatchObject({ outcome: 'aborted' });
  });

  it('bubbles its events to the document', async () => {
    stubClient();
    const { instance } = await mountFetch(`<a data-component="Fetch" href="/page"></a>`);
    const { events, stop } = recordFetchEvents(document);

    await instance.fetch();
    stop();

    expect(types(events)).toContain(FETCH_EVENTS.AFTER_FETCH);
  });

  it('still reaches the page and the element when the swap removes the element', async () => {
    stubClient(() => new Response('<div id="results">page 2</div>'));
    const root = await mount(`
      <div data-component="Action" id="loader"
        data-on:fetch-before="$el.classList.add('is-loading')"
        data-on:fetch-update-after="$el.dataset.updated = 'yes'"
        data-on:fetch-after="$el.classList.remove('is-loading')">
        <div id="results">
          page 1
          <a data-component="Fetch" href="/page-2" data-option-no-view-transition>2</a>
        </div>
      </div>
    `);
    const link = root.querySelector('a')!;
    const instance = getInstance<Fetch>(link, 'Fetch')!;
    const loader = root.querySelector<HTMLElement>('#loader')!;
    const onElement: string[] = [];
    instance.$on(FETCH_EVENTS.AFTER_FETCH, () => onElement.push('fetch-after'));

    link.click();
    expect(loader.classList.contains('is-loading')).toBe(true);
    await waitFor(() => onElement.length === 1);

    expect(link.isConnected).toBe(false);
    expect(document.getElementById('results')?.textContent).toBe('page 2');
    expect(loader.dataset.updated).toBe('yes');
    expect(loader.classList.contains('is-loading')).toBe(false);
  });
});

describe('Fetch — one request at a time per instance', () => {
  it('ends the previous request before the next one starts, so a loader stays on', async () => {
    const { calls } = deferClient();
    const { root, instance } = await mountFetch(`<a data-component="Fetch" href="/page"></a>`);
    const { events } = recordFetchEvents(root);
    let isLoading = false;
    root.addEventListener(FETCH_EVENTS.BEFORE_FETCH, () => (isLoading = true));
    root.addEventListener(FETCH_EVENTS.AFTER_FETCH, () => (isLoading = false));

    const first = instance.fetch('/one');
    await waitFor(() => calls.length === 1);
    const second = instance.fetch('/two');

    expect(isLoading).toBe(true);
    await waitFor(() => calls.length === 2);
    calls[1].resolve(new Response('<div id="fetch-default">two</div>'));

    expect(await first).toBe('aborted');
    expect(await second).toBe('ok');
    expect(isLoading).toBe(false);
    expect(
      events.map(({ type, detail }) => [
        type,
        new URL((detail as { request: FetchRequest }).request.url).pathname,
      ]),
    ).toEqual([
      [FETCH_EVENTS.BEFORE_FETCH, '/one'],
      [FETCH_EVENTS.ABORT, '/one'],
      [FETCH_EVENTS.AFTER_FETCH, '/one'],
      [FETCH_EVENTS.BEFORE_FETCH, '/two'],
      [FETCH_EVENTS.RESPONSE, '/two'],
      [FETCH_EVENTS.BEFORE_UPDATE, '/two'],
      [FETCH_EVENTS.AFTER_UPDATE, '/two'],
      [FETCH_EVENTS.AFTER_FETCH, '/two'],
    ]);
  });

  it('never applies a superseded response, even from a client that ignores the signal', async () => {
    const { calls } = deferClient({ followSignal: false });
    await mount(`<div id="target">old</div>`);
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="/page" data-option-no-view-transition></a>`,
    );
    const { events } = recordFetchEvents(root);

    const first = instance.fetch('/one');
    await waitFor(() => calls.length === 1);
    const second = instance.fetch('/two');
    await waitFor(() => calls.length === 2);
    calls[1].resolve(new Response('<div id="target">two</div>'));
    await second;
    calls[0].resolve(new Response('<div id="target">one</div>'));

    expect(await first).toBe('aborted');
    expect(document.getElementById('target')?.textContent).toBe('two');
    const ofFirst = events.filter(
      ({ detail }) => (detail as { request: FetchRequest }).request.url === abs('/one'),
    );
    expect(types(ofFirst)).toEqual([
      FETCH_EVENTS.BEFORE_FETCH,
      FETCH_EVENTS.ABORT,
      FETCH_EVENTS.AFTER_FETCH,
    ]);
  });

  it('stops a request superseded by a `fetch-update-before` listener before the swap', async () => {
    const { calls } = stubClient((url) =>
      url.endsWith('/one')
        ? new Response('<div id="target">one</div>')
        : new Response('<div id="target">two</div>'),
    );
    await mount(`<div id="target">old</div>`);
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="/page" data-option-no-view-transition></a>`,
    );
    const { events } = recordFetchEvents(root);
    let second: Promise<unknown> | undefined;
    root.addEventListener(
      FETCH_EVENTS.BEFORE_UPDATE,
      () => {
        second = instance.fetch('/two');
      },
      { once: true },
    );

    expect(await instance.fetch('/one')).toBe('aborted');
    await second;

    expect(calls.map(({ url }) => new URL(url).pathname)).toEqual(['/one', '/two']);
    expect(document.getElementById('target')?.textContent).toBe('two');
    expect(
      events
        .filter(({ type }) => type === FETCH_EVENTS.AFTER_UPDATE)
        .map(({ detail }) => (detail as { request: FetchRequest }).request.url),
    ).toEqual([abs('/two')]);
  });

  it('reports `abort(reason)` while in flight as `fetch-abort` with that reason, never as an error', async () => {
    deferClient();
    const { root, instance } = await mountFetch(`<a data-component="Fetch" href="/page"></a>`);
    const { events } = recordFetchEvents(root);

    const outcome = instance.fetch();
    await settle();
    instance.abort('Canceled by user.');

    expect(await outcome).toBe('aborted');
    expect(types(events)).toEqual([
      FETCH_EVENTS.BEFORE_FETCH,
      FETCH_EVENTS.ABORT,
      FETCH_EVENTS.AFTER_FETCH,
    ]);
    expect(detailOf(events, FETCH_EVENTS.ABORT)).toMatchObject({ reason: 'Canceled by user.' });
    expect(detailOf(events, FETCH_EVENTS.AFTER_FETCH)).toMatchObject({ outcome: 'aborted' });
  });

  it('emits no `fetch-abort` for a request that has already settled', async () => {
    stubClient();
    const { root, instance } = await mountFetch(`<a data-component="Fetch" href="/page"></a>`);

    await instance.fetch();
    const { events } = recordFetchEvents(root);
    instance.abort('late');
    await instance.fetch();

    expect(types(events)).not.toContain(FETCH_EVENTS.ABORT);
    expect(types(events).filter((type) => type === FETCH_EVENTS.AFTER_FETCH)).toHaveLength(1);
  });

  it('lets two instances without history run in parallel', async () => {
    const { calls } = deferClient();
    const { root } = await mountFetch(`
      <div>
        <a data-component="Fetch" id="a" href="/a"></a>
        <a data-component="Fetch" id="b" href="/b"></a>
      </div>
    `);
    const a = getInstance<Fetch>(root.querySelector('#a')!, 'Fetch')!;
    const b = getInstance<Fetch>(root.querySelector('#b')!, 'Fetch')!;
    const { events } = recordFetchEvents(root);

    const first = a.fetch();
    const second = b.fetch();
    await waitFor(() => calls.length === 2);
    calls[0].resolve(new Response('<div id="fetch-default">a</div>'));
    calls[1].resolve(new Response('<div id="fetch-default">b</div>'));

    expect(await Promise.all([first, second])).toEqual(['ok', 'ok']);
    expect(types(events)).not.toContain(FETCH_EVENTS.ABORT);
  });
});

describe('Fetch — the DOM change', () => {
  /** Fetch `html` through a link with the given options and settle. */
  async function apply(html: string, attributes = ''): Promise<void> {
    stubClient(() => new Response(html));
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="/page" data-option-no-view-transition ${attributes}></a>`,
    );
    expect(await instance.fetch()).toBe('ok');
  }

  it('replaces the matching element and leaves the rest alone', async () => {
    await mount(`<div id="target">old</div><div id="untouched">keep</div>`);

    await apply('<div id="target">new</div><div id="absent">nope</div>');

    expect(document.getElementById('target')?.textContent).toBe('new');
    expect(document.getElementById('untouched')?.textContent).toBe('keep');
    expect(document.getElementById('absent')).toBeNull();
  });

  it('honours the `selector` option', async () => {
    await mount(`<div id="target">old</div><section id="section">old</section>`);

    await apply(
      '<div id="target">new</div><section id="section">new</section>',
      'data-option-selector="section[id]"',
    );

    expect(document.getElementById('target')?.textContent).toBe('old');
    expect(document.getElementById('section')?.textContent).toBe('new');
  });

  it('appends in `append` mode and prepends in `prepend` mode', async () => {
    await mount(`<div id="target">old</div>`);
    await apply('<div id="target">new</div>', 'data-option-mode="append"');
    expect(document.getElementById('target')?.textContent).toBe('oldnew');

    await apply('<div id="target">first</div>', 'data-option-mode="prepend"');
    expect(document.getElementById('target')?.textContent).toBe('firstoldnew');
  });

  it('keeps the node and updates its attributes in `morph` mode', async () => {
    await mount(`<div id="target" class="old">old</div>`);
    const before = document.getElementById('target');

    await apply('<div id="target" class="new">new</div>', 'data-option-mode="morph"');

    expect(document.getElementById('target')).toBe(before);
    expect(before?.className).toBe('new');
    expect(before?.textContent).toBe('new');
  });

  it('replaces the element itself in `replace` mode, attributes included', async () => {
    await mount(`<div id="target" class="old">old</div>`);
    const before = document.getElementById('target');

    await apply('<div id="target" class="new">new</div>');

    expect(document.getElementById('target')).not.toBe(before);
    expect(document.getElementById('target')?.className).toBe('new');
  });

  it('runs an injected script exactly once and leaves the surviving ones alone', async () => {
    window.__fetchScriptRuns = 0;
    await mount(
      `<div id="target"><script id="kept">window.__fetchScriptRuns = (window.__fetchScriptRuns ?? 0) + 1;</script></div>`,
    );
    const runsAfterInitialParse = window.__fetchScriptRuns;

    await apply(
      '<div id="target"><script>window.__fetchScriptRuns = (window.__fetchScriptRuns ?? 0) + 1;</scr' +
        'ipt></div>',
      'data-option-mode="append"',
    );

    expect(window.__fetchScriptRuns).toBe((runsAfterInitialParse ?? 0) + 1);
    delete window.__fetchScriptRuns;
  });

  it('mounts a component that arrives in the fetched content', async () => {
    await mount(`<div id="target"></div>`);

    await apply('<div id="target"><a data-component="Fetch" href="/inner"></a></div>');
    await settle();

    const injected = document.querySelector('#target [data-component="Fetch"]');
    expect(getInstance<Fetch>(injected as HTMLElement, 'Fetch')?.$isMounted).toBe(true);
  });

  it('gives the parsed document to `fetch-update-after`', async () => {
    stubClient(() => new Response('<title>T</title><div id="target">new</div>'));
    await mount(`<div id="target">old</div>`);
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="/page" data-option-no-view-transition></a>`,
    );
    const { events } = recordFetchEvents(root);

    await instance.fetch();

    const { fragment } = detailOf<FetchEmits['fetch-update-after']>(
      events,
      FETCH_EVENTS.AFTER_UPDATE,
    );
    expect(fragment).toBeInstanceOf(Document);
    expect(fragment?.title).toBe('T');
    expect(
      detailOf<FetchEmits['fetch-update-before']>(events, FETCH_EVENTS.BEFORE_UPDATE).content,
    ).toBe('<title>T</title><div id="target">new</div>');
  });
});

describe('Fetch — the `js-toolkit:dom:update` negotiation', () => {
  it('runs the change inside a view transition by default', async () => {
    const { spy, restore } = stubViewTransition();
    stubClient(() => new Response('<div id="target">new</div>'));
    await mount(`<div id="target">old</div>`);
    const { instance } = await mountFetch(`<a data-component="Fetch" href="/page"></a>`);

    await instance.fetch();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(document.getElementById('target')?.textContent).toBe('new');
    restore();
  });

  it('skips the view transition when the option is off', async () => {
    const { spy, restore } = stubViewTransition();
    stubClient(() => new Response('<div id="target">new</div>'));
    await mount(`<div id="target">old</div>`);
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="/page" data-option-no-view-transition></a>`,
    );

    await instance.fetch();

    expect(spy).not.toHaveBeenCalled();
    expect(document.getElementById('target')?.textContent).toBe('new');
    restore();
  });

  it('lets an ancestor `wrap()` runner replace the default view transition', async () => {
    const { spy, restore } = stubViewTransition();
    stubClient(() => new Response('<div id="target">new</div>'));
    await mount(`<div id="target">old</div>`);
    const { root, instance } = await mountFetch(`<a data-component="Fetch" href="/page"></a>`);
    const seen: unknown[] = [];
    root.addEventListener('js-toolkit:dom:update', (event) => {
      const { detail } = event as CustomEvent<{
        request: FetchRequest;
        wrap(runner: (apply: () => void) => void): void;
      }>;
      seen.push(detail.request.url);
      detail.wrap((apply) => apply());
    });

    await instance.fetch();

    expect(seen).toEqual([abs('/page')]);
    expect(spy).not.toHaveBeenCalled();
    expect(document.getElementById('target')?.textContent).toBe('new');
    restore();
  });

  it('applies the change anyway when a runner settles without applying it', async () => {
    const diagnostics = captureDiagnostics();
    stubClient(() => new Response('<div id="target">new</div>'));
    await mount(`<div id="target">old</div>`);
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="/page" data-option-no-view-transition></a>`,
    );
    root.addEventListener('js-toolkit:dom:update', (event) => {
      (event as CustomEvent<{ wrap(runner: () => void): void }>).detail.wrap(() => {});
    });

    expect(await instance.fetch()).toBe('ok');
    expect(document.getElementById('target')?.textContent).toBe('new');
    expect(diagnostics.codes).toContain('protocol.unapplied-dom-update');
    diagnostics.stop();
  });

  it('stops claiming the protocol once the change has settled', async () => {
    const { spy, restore } = stubViewTransition();
    stubClient(() => new Response('<div id="target">new</div>'));
    await mount(`<div id="target">old</div>`);
    const { instance } = await mountFetch(`<a data-component="Fetch" href="/page"></a>`);

    await instance.fetch();
    const callsAfterUpdate = spy.mock.calls.length;
    let isClaimed = false;
    instance.$el.dispatchEvent(
      new CustomEvent('js-toolkit:dom:update', {
        bubbles: true,
        detail: {
          wrap() {
            isClaimed = true;
          },
        },
      }),
    );

    expect(isClaimed).toBe(false);
    expect(spy.mock.calls).toHaveLength(callsAfterUpdate);
    restore();
  });

  it('reports a failed DOM change as `fetch-error` inside the default view transition', async () => {
    const { spy, restore } = stubViewTransition();
    stubClient();
    const { root, instance } = await mountFetch<FailingApplyFetch>(
      `<a data-component="FailingApplyFetch" href="/page"></a>`,
      'FailingApplyFetch',
    );
    const { events } = recordFetchEvents(root);

    expect(await instance.fetch()).toBe('error');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(types(events).slice(-2)).toEqual([FETCH_EVENTS.ERROR, FETCH_EVENTS.AFTER_FETCH]);
    expect(types(events)).not.toContain(FETCH_EVENTS.AFTER_UPDATE);
    expect(
      (detailOf<FetchEmits['fetch-error']>(events, FETCH_EVENTS.ERROR).error as Error).message,
    ).toBe('apply failed');
    restore();
  });

  it('reports a failed DOM change as `fetch-error` with the view transition off', async () => {
    stubClient();
    const { root, instance } = await mountFetch<FailingApplyFetch>(
      `<a data-component="FailingApplyFetch" href="/page" data-option-no-view-transition></a>`,
      'FailingApplyFetch',
    );
    const { events } = recordFetchEvents(root);

    expect(await instance.fetch()).toBe('error');
    expect(types(events).slice(-2)).toEqual([FETCH_EVENTS.ERROR, FETCH_EVENTS.AFTER_FETCH]);
  });

  it('reports a failed DOM change even under a runner that catches every error', async () => {
    stubClient();
    const { root, instance } = await mountFetch<FailingApplyFetch>(
      `<a data-component="FailingApplyFetch" href="/page"></a>`,
      'FailingApplyFetch',
    );
    root.addEventListener('js-toolkit:dom:update', (event) => {
      (event as CustomEvent<{ wrap(runner: (apply: () => unknown) => unknown): void }>).detail.wrap(
        async (apply) => {
          try {
            await apply();
          } catch {
            // A runner such as MotionView swallows what it runs.
          }
        },
      );
    });
    const { events } = recordFetchEvents(root);

    expect(await instance.fetch()).toBe('error');
    expect(types(events)).toContain(FETCH_EVENTS.ERROR);
  });

  it('keeps applying the other changes of a batched view transition when one fails', async () => {
    const { spy, restore } = stubViewTransition();
    stubClient(() => new Response('<div id="ok-target">new</div>'));
    await mount(`<div id="ok-target">old</div>`);
    const { root } = await mountFetch(`
      <div>
        <a data-component="FailingApplyFetch" href="/fail"></a>
        <a data-component="Fetch" href="/ok"></a>
      </div>
    `);
    const failing = getInstance<Fetch>(root.querySelector('[href="/fail"]')!, 'FailingApplyFetch')!;
    const working = getInstance<Fetch>(root.querySelector('[href="/ok"]')!, 'Fetch')!;

    const outcomes = await Promise.all([failing.fetch(), working.fetch()]);

    expect(outcomes).toEqual(['error', 'ok']);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(document.getElementById('ok-target')?.textContent).toBe('new');
    restore();
  });

  it('keeps a runner that fails after a successful change a diagnostic, with the outcome `ok`', async () => {
    const diagnostics = captureDiagnostics();
    stubClient(() => new Response('<div id="target">new</div>'));
    await mount(`<div id="target">old</div>`);
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="/page" data-option-no-view-transition></a>`,
    );
    root.addEventListener('js-toolkit:dom:update', (event) => {
      (event as CustomEvent<{ wrap(runner: (apply: () => unknown) => unknown): void }>).detail.wrap(
        async (apply) => {
          await apply();
          throw new Error('transition failed');
        },
      );
    });
    const { events } = recordFetchEvents(root);

    expect(await instance.fetch()).toBe('ok');
    expect(types(events)).not.toContain(FETCH_EVENTS.ERROR);
    expect(document.getElementById('target')?.textContent).toBe('new');
    expect(diagnostics.codes).toContain('callback.dom-update-runner-failed');
    diagnostics.stop();
  });
});

describe('Fetch — declarative triggers', () => {
  it('fetches on a plain left click of a link', async () => {
    const { spy } = stubClient();
    const { el } = await mountFetch(`<a data-component="Fetch" href="/target"></a>`);

    el.click();
    await settle();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['ctrlKey', { ctrlKey: true }],
    ['shiftKey', { shiftKey: true }],
    ['altKey', { altKey: true }],
    ['metaKey', { metaKey: true }],
    ['a secondary button', { button: 1 }],
  ])('does not fetch on a click with %s', async (_label, init) => {
    const { spy } = stubClient();
    const { el } = await mountFetch(`<a data-component="Fetch" href="/target"></a>`);

    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...init }));
    await settle();

    expect(spy).not.toHaveBeenCalled();
  });

  it.each(['_blank', '_top', 'named-frame'])(
    'leaves a link with `target="%s"` to the browser',
    async (target) => {
      const { spy } = stubClient();
      const { el } = await mountFetch(
        `<a data-component="Fetch" href="/target" target="${target}"></a>`,
      );

      el.click();
      await settle();

      expect(spy).not.toHaveBeenCalled();
    },
  );

  it('does nothing on a click when the element is not a link', async () => {
    const { spy } = stubClient();
    const { el } = await mountFetch(`<div data-component="Fetch"></div>`);

    el.click();
    await settle();

    expect(spy).not.toHaveBeenCalled();
  });

  it('answers `isLink` and `isForm` from the element itself', async () => {
    const { instance: link } = await mountFetch(`<a data-component="Fetch" href="#a"></a>`);
    const { instance: form } = await mountFetch(`<form data-component="Fetch"></form>`);
    const { instance: div } = await mountFetch(`<div data-component="Fetch"></div>`);

    expect([link.isLink, link.isForm]).toEqual([true, false]);
    expect([form.isLink, form.isForm]).toEqual([false, true]);
    expect([div.isLink, div.isForm]).toEqual([false, false]);
  });
});

describe('Fetch — native form submission', () => {
  /** Submit the mounted form through the given submit button, or with none. */
  function submit(root: HTMLElement, selector?: string): void {
    const form = root.querySelector('form') as HTMLFormElement;
    form.requestSubmit(selector ? form.querySelector<HTMLElement>(selector) : null);
  }

  /** Put a real file in a file control, the way a file picker does. */
  function attachFile(root: HTMLElement, name = 'photo.png'): File {
    const input = root.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['pixels'], name, { type: 'image/png' });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    return file;
  }

  it('puts the name and value of the submitter in the query of a GET form', async () => {
    const { calls } = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="/search" method="get">
        <input name="q" value="hello">
        <button type="submit" name="page" value="2">Next</button>
      </form>`,
    );

    submit(root, 'button');
    await settle();

    expect(calls[0].url).toBe(abs('/search?q=hello&page=2'));
  });

  it('puts the name and value of the submitter in the body of a POST form', async () => {
    const { calls } = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="/search" method="post">
        <input type="checkbox" name="genre" value="rock" checked>
        <input type="checkbox" name="genre" value="jazz" checked>
        <button type="submit" name="page" value="2">Next</button>
      </form>`,
    );

    submit(root, 'button');
    await settle();

    const body = calls[0].init.body as URLSearchParams;
    expect(body).toBeInstanceOf(URLSearchParams);
    expect(body.getAll('genre')).toEqual(['rock', 'jazz']);
    expect(body.get('page')).toBe('2');
  });

  it('sends no submitter value when the form is submitted without one', async () => {
    const { calls } = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="/search" method="get">
        <input name="q" value="hello">
        <button type="submit" name="page" value="2">Next</button>
      </form>`,
    );

    submit(root);
    await settle();

    expect(calls[0].url).toBe(abs('/search?q=hello'));
  });

  it('does not carry a submitter into a later `fetch()`', async () => {
    const { calls } = stubClient();
    const { root, instance } = await mountFetch(
      `<form data-component="Fetch" action="/search" method="get">
        <button type="submit" name="page" value="2">Next</button>
      </form>`,
    );

    submit(root, 'button');
    await settle();
    await instance.fetch();

    expect(new URL(calls[0].url).searchParams.get('page')).toBe('2');
    expect(new URL(calls[1].url).searchParams.has('page')).toBe(false);
  });

  it('replaces the query of the action with the fields of a GET form', async () => {
    const { calls } = stubClient();
    const { instance } = await mountFetch(
      `<form data-component="Fetch" action="/search?stale=1&amp;q=old" method="get">
        <input name="q" value="new">
        <select name="genre" multiple>
          <option value="rock" selected>Rock</option>
          <option value="jazz" selected>Jazz</option>
        </select>
      </form>`,
    );

    await instance.fetch();

    expect(calls[0].url).toBe(abs('/search?q=new&genre=rock&genre=jazz'));
  });

  it('lets `formaction` win over the action and `src`, and keeps `params`', async () => {
    const { calls } = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="/search" method="get" data-option-history
        data-option-src="/apps/search" data-option-params='{"view":"fragment"}'>
        <input name="q" value="hello">
        <button type="submit" formaction="/elsewhere">Elsewhere</button>
      </form>`,
    );

    submit(root, 'button');
    await settle();

    expect(calls[0].url).toBe(abs('/elsewhere?q=hello&view=fragment'));
    expect(window.location.pathname).toBe('/elsewhere');
    expect(window.location.search).toBe('?q=hello');
  });

  it('lets `formmethod` turn a GET form into a POST, and a POST form into a GET', async () => {
    const { calls } = stubClient();
    const { root } = await mountFetch(
      `<div>
        <form data-component="Fetch" id="to-post" action="/search" method="get">
          <input name="q" value="hello">
          <button type="submit" formmethod="post">Post</button>
        </form>
        <form data-component="Fetch" id="to-get" action="/search" method="post">
          <input name="q" value="hello">
          <button type="submit" formmethod="get">Get</button>
        </form>
      </div>`,
    );

    for (const id of ['to-post', 'to-get']) {
      const form = root.querySelector<HTMLFormElement>(`#${id}`)!;
      form.requestSubmit(form.querySelector('button'));
    }
    await settle();

    expect(calls[0]).toMatchObject({ url: abs('/search'), init: { method: 'POST' } });
    expect(String(calls[0].init.body)).toBe('q=hello');
    expect(calls[1]).toMatchObject({ url: abs('/search?q=hello'), init: { method: 'GET' } });
    expect(calls[1].init.body).toBeUndefined();
  });

  it('sends a URL-encoded body by default, with the name of a file and a warning', async () => {
    const diagnostics = captureDiagnostics();
    const { calls } = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="/upload" method="post">
        <input name="title" value="Holiday">
        <input type="file" name="photo">
      </form>`,
    );
    attachFile(root);

    submit(root);
    await settle();

    const body = calls[0].init.body as URLSearchParams;
    expect(body).toBeInstanceOf(URLSearchParams);
    expect(String(body)).toBe('title=Holiday&photo=photo.png');
    expect(diagnostics.codes).toContain('fetch.file-not-uploaded');
    diagnostics.stop();
  });

  it('sends the file itself with `enctype="multipart/form-data"`, and no warning', async () => {
    const diagnostics = captureDiagnostics();
    const { calls } = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="photo">
      </form>`,
    );
    const file = attachFile(root);

    submit(root);
    await settle();

    const body = calls[0].init.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect((body.get('photo') as File).name).toBe(file.name);
    expect(diagnostics.codes).not.toContain('fetch.file-not-uploaded');
    diagnostics.stop();
  });

  it('lets `formenctype` override the enctype of the form', async () => {
    const { calls } = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="/upload" method="post">
        <input type="file" name="photo">
        <button type="submit" formenctype="multipart/form-data">Upload</button>
      </form>`,
    );
    attachFile(root);

    submit(root, 'button');
    await settle();

    expect(calls[0].init.body).toBeInstanceOf(FormData);
  });

  it('sends `name=value` lines for `enctype="text/plain"`', async () => {
    const { calls } = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="/upload" method="post" enctype="text/plain">
        <input name="a" value="1">
        <input name="b" value="2">
      </form>`,
    );

    submit(root);
    await settle();

    expect(calls[0].init.body).toBe('a=1\r\nb=2\r\n');
  });

  it.each([
    ['method="dialog"', 'method="dialog"', ''],
    ['formmethod="dialog"', 'method="post"', 'formmethod="dialog"'],
  ])('leaves %s to the browser, which closes the dialog', async (_label, formMethod, button) => {
    const { spy } = stubClient();
    const root = await mount(`
      <dialog>
        <form data-component="Fetch" action="/never" ${formMethod}>
          <button type="submit" ${button}>Close</button>
        </form>
      </dialog>
    `);
    const dialog = root.querySelector('dialog')!;
    dialog.show();
    const form = root.querySelector('form')!;
    let isPreventedByFetch: boolean | undefined;
    form.addEventListener('submit', (event) => (isPreventedByFetch = event.defaultPrevented));
    allowNativeSubmit();

    form.requestSubmit(form.querySelector('button'));
    await settle();

    expect(isPreventedByFetch).toBe(false);
    expect(dialog.open).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('leaves a submitter with `formtarget="_blank"` to the browser', async () => {
    const { spy } = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="/search" method="get">
        <button type="submit" formtarget="_blank">New tab</button>
      </form>`,
    );

    submit(root, 'button');
    await settle();

    expect(spy).not.toHaveBeenCalled();
  });

  it('handles a submitter with `formtarget="_self"` in a form that targets a new tab', async () => {
    const { spy } = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="/search" method="get" target="_blank">
        <button type="submit" formtarget="_self">Here</button>
      </form>`,
    );

    submit(root, 'button');
    await settle();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('leaves a form that targets a new tab to the browser', async () => {
    const { spy } = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="/search" method="get" target="_blank"></form>`,
    );

    submit(root);
    await settle();

    expect(spy).not.toHaveBeenCalled();
  });
});

describe('Fetch — Track reads the response of an update', () => {
  it('resolves a response header path in a `data-track:fetch-update-after` declaration', async () => {
    window.dataLayer = [];
    stubClient(
      () =>
        new Response('<div id="results">3 results</div>', {
          headers: { 'X-Search-Result-Count': '3' },
        }),
    );
    const root = await mount(`
      <div data-component="Track"
        data-track:fetch-update-after='{"event": "search", "results": "$event.detail.response.headers.x-search-result-count", "query": "$detail.request.destination"}'>
        <form data-component="Fetch" action="/search" method="get" data-option-no-view-transition>
          <input name="q" value="boots">
        </form>
        <div id="results">0 results</div>
      </div>
    `);
    const form = root.querySelector('form')!;

    form.requestSubmit();
    await waitFor(() => window.dataLayer?.length);

    expect(window.dataLayer).toEqual([
      { event: 'search', results: '3', query: abs('/search?q=boots') },
    ]);
    expect(document.getElementById('results')?.textContent).toBe('3 results');
  });
});

describe('Fetch — options', () => {
  it('warns about an invalid `historyMode` and pushes', async () => {
    const diagnostics = captureDiagnostics();
    stubClient();
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="/page" data-option-history data-option-history-mode="sideways"></a>`,
    );
    const request = nextRequest(root);
    const writes = recordHistoryWrites();

    await instance.fetch();

    expect((await request).history).toBe('push');
    expect(writes.pushed).toEqual([abs('/page')]);
    expect(diagnostics.codes).toContain('fetch.invalid-history-mode');
    diagnostics.stop();
  });

  it('keeps the recipe of the entry to plain data', async () => {
    stubClient();
    const { instance } = await mountFetch(
      `<a data-component="Fetch" id="next" href="/page" data-option-history
        data-option-selector="#list" data-option-mode="append"
        data-option-params='{"view":"fragment"}' data-option-src="endpoint"
        data-option-headers='{"X-Variant":"compact"}'></a>`,
    );

    await instance.fetch();

    const { fetch: recipe } = window.history.state as { fetch: RestoreRecipe };
    expect(recipe).toEqual({
      component: 'Fetch',
      owner: 'next',
      selector: '#list',
      mode: 'replace',
      params: { view: 'fragment' },
      src: abs('endpoint'),
      response: 'response.text()',
      headers: { 'x-variant': 'compact' },
      viewTransition: true,
    });
  });
});
