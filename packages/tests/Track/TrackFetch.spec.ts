import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { mount, resetDom } from '@studiometa/js-toolkit/test';
import { Fetch } from '#private/Fetch/Fetch.js';
import { Track } from '#private/Track/Track.js';

/**
 * The scenario both `$event` paths exist for: a `Fetch` announces its own
 * lifecycle as plain data, and a `Track` declared on the same element reads
 * that data by path, with no code between the two.
 */

registerComponents(Fetch, Track);

const originalFetch = window.fetch;
const originalHref = window.location.href;

beforeEach(() => {
  window.dataLayer = [];
});

afterEach(async () => {
  window.fetch = originalFetch;
  window.history.replaceState({}, '', originalHref);
  await resetDom();
});

function lastPush(): Record<string, unknown> | undefined {
  return window.dataLayer?.at(-1);
}

describe('Track — reading a Fetch lifecycle event by path', () => {
  it('resolves a response header, the request and a search param off `fetch-update-after`', async () => {
    window.fetch = vi.fn(
      async () =>
        new Response('<div id="results">new</div>', {
          headers: { 'x-search-result-count': '42' },
        }),
    ) as unknown as typeof fetch;

    const root = await mount(`
      <form id="search" action="/search" data-component="Fetch Track"
        data-option-selector="#results"
        data-option-no-view-transition
        data-track:fetch-update-after='{
          "event": "content_search_results",
          "result_count": "$event.detail.response.headers.x-search-result-count",
          "status": "$event.detail.response.status",
          "method": "$event.detail.request.method",
          "genre": "$event.detail.request.searchParams.genre.0",
          "missing": "$event.detail.response.headers.x-absent"
        }'></form>
      <div id="results">old</div>
    `);
    const fetchInstance = getInstance<Fetch>(root.querySelector('#search'), 'Fetch')!;

    await fetchInstance.fetch('/search?genre=rock&genre=jazz');

    expect(root.querySelector('#results')?.textContent).toBe('new');
    expect(lastPush()).toEqual({
      event: 'content_search_results',
      result_count: '42',
      status: 200,
      method: 'GET',
      genre: 'rock',
      missing: undefined,
    });
  });

  it('resolves the same value through the `$detail` shorthand', async () => {
    window.fetch = vi.fn(
      async () =>
        new Response('<div id="results">new</div>', {
          headers: { 'x-search-result-count': '7' },
        }),
    ) as unknown as typeof fetch;

    const root = await mount(`
      <form id="search" action="/search" data-component="Fetch Track"
        data-option-selector="#results"
        data-option-no-view-transition
        data-track:fetch-update-after='{
          "event": "content_search_results",
          "long": "$event.detail.response.headers.x-search-result-count",
          "short": "$detail.response.headers.x-search-result-count"
        }'></form>
      <div id="results">old</div>
    `);
    const fetchInstance = getInstance<Fetch>(root.querySelector('#search'), 'Fetch')!;

    await fetchInstance.fetch('/search');

    expect(lastPush()).toEqual({
      event: 'content_search_results',
      long: '7',
      short: '7',
    });
  });
});
