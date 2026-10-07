import { describe, expect, it } from 'vitest';
import { registerComponents } from '@studiometa/js-toolkit';
import { mount, waitFor } from '@studiometa/js-toolkit/test';
import { FETCH_EVENTS, type FetchEmits, type FetchRequest } from '#private/Fetch/Fetch.js';
import { FetchShopifySection } from '#private/Fetch/FetchShopifySection.js';
import {
  abs,
  back,
  deferClient,
  detailOf,
  mountFetch,
  recordFetchEvents,
  stubClient,
  types,
  useFetchSpecHooks,
} from './helpers.js';

registerComponents(FetchShopifySection);

useFetchSpecHooks();

/** Mount one `FetchShopifySection` from markup. */
function mountSection(html: string): ReturnType<typeof mountFetch<FetchShopifySection>> {
  return mountFetch<FetchShopifySection>(html, 'FetchShopifySection');
}

/** A Section Rendering API endpoint: JSON with one HTML string per section. */
function serveSections(): ReturnType<typeof stubClient> {
  return stubClient((url) => {
    const { searchParams } = new URL(url);
    const page = searchParams.get('page') ?? '1';
    const sections = (searchParams.get('sections') ?? '').split(',').filter(Boolean);
    return new Response(
      JSON.stringify(
        Object.fromEntries(sections.map((id) => [id, `<div id="${id}">${id} ${page}</div>`])),
      ),
    );
  });
}

describe('FetchShopifySection', () => {
  it('inherits the whole base config along the prototype chain', async () => {
    const { instance } = await mountSection(
      `<a data-component="FetchShopifySection" href="/page"></a>`,
    );

    expect(Object.keys(FetchShopifySection.config.options ?? {})).toEqual(['sections']);
    expect(instance.$config.name).toBe('FetchShopifySection');
    expect(instance.$config.options).toHaveProperty('params');
    expect(instance.$config.options).toHaveProperty('historyMode');
    expect(instance.$config.refs).toEqual(['headers[]']);
  });

  it('asks for the sections through `params`, leaving the href untouched', async () => {
    const { calls } = serveSections();
    const { root, instance } = await mountSection(
      `<a data-component="FetchShopifySection" href="/collections/all?page=2"
        data-option-sections=" header , , footer " data-option-params='{"view":"compact"}'
        data-option-no-view-transition></a>`,
    );
    const { events } = recordFetchEvents(root);

    await instance.fetch();

    expect(instance.sectionIds).toEqual(['header', 'footer']);
    expect(calls[0].url).toBe(abs('/collections/all?page=2&view=compact&sections=header%2Cfooter'));
    expect(
      detailOf<FetchEmits['fetch-before']>(events, FETCH_EVENTS.BEFORE_FETCH).request,
    ).toMatchObject({
      destination: abs('/collections/all?page=2'),
    });
    expect((instance.$el as HTMLAnchorElement).getAttribute('href')).toBe(
      '/collections/all?page=2',
    );
  });

  it('unwraps the JSON response, swaps each section by id and drops null sections', async () => {
    stubClient(
      () =>
        new Response(JSON.stringify({ header: '<div id="header">new header</div>', footer: null })),
    );
    await mount(`<div id="header">old header</div><div id="footer">old footer</div>`);
    const { instance } = await mountSection(
      `<a data-component="FetchShopifySection" href="/page" data-option-sections="header,footer"
        data-option-no-view-transition></a>`,
    );

    expect(await instance.fetch()).toBe('ok');

    expect(document.getElementById('header')?.textContent).toBe('new header');
    expect(document.getElementById('footer')?.textContent).toBe('old footer');
  });

  it('degrades to the base text response when no sections are configured', async () => {
    const { calls } = stubClient(() => new Response('<div id="target">plain html</div>'));
    await mount(`<div id="target">old</div>`);
    const { instance } = await mountSection(
      `<a data-component="FetchShopifySection" href="/page" data-option-no-view-transition></a>`,
    );

    await instance.fetch();

    expect(new URL(calls[0].url).searchParams.has('sections')).toBe(false);
    expect(document.getElementById('target')?.textContent).toBe('plain html');
  });

  it('honours a custom `response` option instead of unwrapping the JSON', async () => {
    stubClient(() => new Response(JSON.stringify({ html: '<div id="target">custom</div>' })));
    await mount(`<div id="target">old</div>`);
    const { instance } = await mountSection(
      `<a data-component="FetchShopifySection" href="/page" data-option-sections="header"
        data-option-no-view-transition
        data-option-response="response.json().then((data) => data.html)"></a>`,
    );

    await instance.fetch();

    expect(document.getElementById('target')?.textContent).toBe('custom');
  });

  it('keeps `sections` for a submitter with `formaction`, drops `params`, and still parses JSON', async () => {
    const { calls } = serveSections();
    await mount(`<div id="results">results 1</div>`);
    const { root } = await mountSection(
      `<form data-component="FetchShopifySection" action="/search" method="get"
        data-option-sections="results" data-option-params='{"view":"fragment"}'
        data-option-no-view-transition>
        <input name="page" value="4">
        <button type="submit" formaction="/collections/all">Go</button>
      </form>`,
    );
    const form = root.querySelector('form')!;

    form.requestSubmit(form.querySelector('button'));
    await waitFor(() => document.getElementById('results')?.textContent === 'results 4');

    expect(calls[0].url).toBe(abs('/collections/all?page=4&sections=results'));
  });

  it('keeps `sections` for a submitter with `formaction` when `params` has the same `sections`', async () => {
    const { calls } = serveSections();
    await mount(`<div id="results">results 1</div>`);
    const { root } = await mountSection(
      `<form data-component="FetchShopifySection" action="/search" method="get"
        data-option-sections="results" data-option-params='{"sections":"results"}'
        data-option-no-view-transition>
        <input name="page" value="4">
        <button type="submit" formaction="/collections/all">Go</button>
      </form>`,
    );
    const form = root.querySelector('form')!;

    form.requestSubmit(form.querySelector('button'));
    await waitFor(() => document.getElementById('results')?.textContent === 'results 4');

    expect(calls[0].url).toBe(abs('/collections/all?page=4&sections=results'));
  });

  it('reports a section endpoint that does not answer JSON as an error', async () => {
    stubClient(() => new Response('<html>not json</html>'));
    const { root, instance } = await mountSection(
      `<a data-component="FetchShopifySection" href="/page" data-option-sections="header"></a>`,
    );
    const { events } = recordFetchEvents(root);

    expect(await instance.fetch()).toBe('error');
    expect(types(events)).toEqual([
      FETCH_EVENTS.BEFORE_FETCH,
      FETCH_EVENTS.RESPONSE,
      FETCH_EVENTS.ERROR,
      FETCH_EVENTS.AFTER_FETCH,
    ]);
  });

  it('follows the inherited supersede rule', async () => {
    const { calls } = deferClient();
    const { root, instance } = await mountSection(
      `<a data-component="FetchShopifySection" href="/page" data-option-sections="header"></a>`,
    );
    const { events } = recordFetchEvents(root);

    const first = instance.fetch('/one');
    await waitFor(() => calls.length === 1);
    const second = instance.fetch('/two');
    await waitFor(() => calls.length === 2);
    calls[1].resolve(new Response('{}'));

    expect(await first).toBe('aborted');
    expect(await second).toBe('ok');
    expect(
      events
        .filter(({ type }) => type === FETCH_EVENTS.AFTER_FETCH)
        .map(({ detail }) => [
          new URL((detail as { request: FetchRequest }).request.url).pathname,
          (detail as FetchEmits['fetch-after']).outcome,
        ]),
    ).toEqual([
      ['/one', 'aborted'],
      ['/two', 'ok'],
    ]);
  });
});

describe('FetchShopifySection — history', () => {
  it('never shows `sections` in the address bar, and asks for them again on back', async () => {
    window.history.pushState(null, '', '/collections/all?page=1');
    const { calls } = serveSections();
    await mount(`<div id="grid">grid 1</div>`);
    const { instance } = await mountSection(
      `<a data-component="FetchShopifySection" href="/collections/all?page=2"
        data-option-sections="grid" data-option-history data-option-no-view-transition></a>`,
    );

    await instance.fetch();
    expect(window.location.search).toBe('?page=2');
    expect(document.getElementById('grid')?.textContent).toBe('grid 2');

    await back();
    await waitFor(() => document.getElementById('grid')?.textContent === 'grid 1');

    expect(calls[1].url).toBe(abs('/collections/all?page=1&sections=grid'));
    expect(window.location.search).toBe('?page=1');
  });

  it('parses JSON on a restore with no owner left on the page', async () => {
    window.history.pushState(null, '', '/collections/all?page=1');
    const { calls } = serveSections();
    const root = await mount(`
      <div id="grid">
        grid 1
        <a data-component="FetchShopifySection" href="/collections/all?page=2"
          data-option-sections="grid" data-option-history data-option-no-view-transition>2</a>
      </div>
    `);

    root.querySelector('a')!.click();
    await waitFor(() => document.getElementById('grid')?.textContent === 'grid 2');
    expect(document.querySelector('[data-component="FetchShopifySection"]')).toBeNull();
    await back();
    await waitFor(() => document.getElementById('grid')?.textContent === 'grid 1');

    expect(calls[1].url).toBe(abs('/collections/all?page=1&sections=grid'));
  });
});
