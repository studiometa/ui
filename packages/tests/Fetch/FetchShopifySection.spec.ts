import { describe, it, expect, vi, afterEach } from 'vitest';
import { FetchShopifySection } from '@studiometa/ui';
import { h, mount, wait } from '#test-utils';

/**
 * Build a JSON `Response` shaped like the Shopify Section Rendering API output.
 */
function sectionsResponse(sections: Record<string, string | null>) {
  return new Response(JSON.stringify(sections), {
    headers: { 'content-type': 'application/json' },
  });
}

describe('The FetchShopifySection class', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('should have the correct config', () => {
    expect(FetchShopifySection.config.name).toBe('FetchShopifySection');
    expect(FetchShopifySection.config.options.sections).toBe(Array);
    expect(FetchShopifySection.config.options.response.default).toContain('response.json()');
  });

  it('should append the `sections` option to the request URL without touching the href', async () => {
    const anchor = h('a', {
      href: 'https://example.com/collections/all?sort_by=price',
      dataOptionSections: ['product-grid', 'product-count'],
    });
    const fetch = new FetchShopifySection(anchor);
    await mount(fetch);

    // The element's href is left clean for the no-JS fallback…
    expect(anchor.getAttribute('href')).toBe('https://example.com/collections/all?sort_by=price');
    // …while the request URL carries the sections parameter alongside existing params.
    expect(fetch.url.searchParams.get('sort_by')).toBe('price');
    expect(fetch.url.searchParams.get('sections')).toBe('product-grid,product-count');
  });

  it('should unwrap the JSON response and swap each section by id', async () => {
    document.body.innerHTML = '<div id="price">old</div>';
    const spy = vi.spyOn(window, 'fetch');
    spy.mockResolvedValue(sectionsResponse({ price: '<div id="price">new</div>' }));

    const anchor = h('a', {
      href: 'https://example.com/products/foo',
      dataOptionSections: ['price'],
    });
    const fetch = new FetchShopifySection(anchor);
    await mount(fetch);
    await fetch.fetch();
    await wait(10);

    expect(spy).toHaveBeenCalledOnce();
    expect((spy.mock.calls[0][0] as URL).searchParams.get('sections')).toBe('price');
    expect(document.getElementById('price')?.textContent).toBe('new');
  });

  it('should drop sections returned as null via `filter(Boolean)`', async () => {
    document.body.innerHTML = '<div id="a">old-a</div><div id="b">old-b</div>';
    const spy = vi.spyOn(window, 'fetch');
    spy.mockResolvedValue(sectionsResponse({ a: '<div id="a">new-a</div>', b: null }));

    const anchor = h('a', { href: 'https://example.com/x', dataOptionSections: ['a', 'b'] });
    const fetch = new FetchShopifySection(anchor);
    await mount(fetch);
    await fetch.fetch();
    await wait(10);

    expect(document.getElementById('a')?.textContent).toBe('new-a');
    // The null section is skipped, leaving its element untouched.
    expect(document.getElementById('b')?.textContent).toBe('old-b');
  });

  it('should keep the `sections` parameter out of the history / update URL', async () => {
    const spy = vi.spyOn(window, 'fetch');
    spy.mockResolvedValue(sectionsResponse({ price: '<div id="price">new</div>' }));

    const anchor = h('a', {
      href: 'https://example.com/products/foo?variant=42',
      dataOptionSections: ['price'],
      dataOptionHistory: '',
    });
    const fetch = new FetchShopifySection(anchor);

    let updateUrl: URL | undefined;
    fetch.$on(FetchShopifySection.FETCH_EVENTS.BEFORE_UPDATE, (event) => {
      updateUrl = (event as CustomEvent).detail[0].url;
    });

    await mount(fetch);
    await fetch.fetch();
    await wait(10);

    // The request went out with the sections parameter…
    expect((spy.mock.calls[0][0] as URL).searchParams.get('sections')).toBe('price');
    // …but the URL handed to update()/history is the clean, human-facing one.
    expect(updateUrl?.searchParams.has('sections')).toBe(false);
    expect(updateUrl?.searchParams.get('variant')).toBe('42');
  });
});
