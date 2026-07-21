import { describe, it, expect, vi, afterEach } from 'vitest';
import { ShopifyPartialsFetch } from '@studiometa/ui';
import { h, mount } from '#test-utils';

const FAKE_UPDATE = { partials: [{ name: 'product-grid', html: '<div>updated</div>' }] };

const originalLoader = ShopifyPartialsFetch.__loadPartialsModule;

/**
 * Build a fake partials API and wire it into the static loader.
 */
function useFakePartials(overrides: Record<string, unknown> = {}) {
  const fakePartials = {
    fetch: vi.fn().mockResolvedValue(FAKE_UPDATE),
    apply: vi.fn(),
    ...overrides,
  };
  ShopifyPartialsFetch.__loadPartialsModule = async () => ({ partials: fakePartials }) as any;
  return fakePartials;
}

describe('The ShopifyPartialsFetch class', () => {
  afterEach(() => {
    ShopifyPartialsFetch.__loadPartialsModule = originalLoader;
    vi.restoreAllMocks();
  });

  it('should use Shopify partials when the `partials` option is set', async () => {
    const fakePartials = useFakePartials();
    const anchor = h('a', {
      href: 'https://example.com/collections/all',
      dataOptionPartials: ['product-grid', 'product-count'],
    });
    const fetch = new ShopifyPartialsFetch(anchor);

    await mount(fetch);
    anchor.dispatchEvent(new MouseEvent('click', { button: 0 }));
    // Wait for the async fetch lifecycle to settle.
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(fakePartials.fetch).toHaveBeenCalledOnce();
    const args = fakePartials.fetch.mock.calls[0];
    expect(args.slice(0, 2)).toEqual(['product-grid', 'product-count']);
    const options = args[args.length - 1];
    expect(options.url).toBe('https://example.com/collections/all');
    expect(options.signal).toBeInstanceOf(AbortSignal);

    expect(fakePartials.apply).toHaveBeenCalledWith(FAKE_UPDATE);
  });

  it('should fall back to base Fetch when no `partials` option is set', async () => {
    const fakePartials = useFakePartials();
    const windowFetchSpy = vi.spyOn(window, 'fetch');
    windowFetchSpy.mockImplementation(() => Promise.resolve(new Response('<div id="test">ok</div>')));

    const anchor = h('a', { href: 'https://example.com' });
    const fetch = new ShopifyPartialsFetch(anchor);

    await mount(fetch);
    await fetch.fetch(new URL('https://example.com'));

    expect(fakePartials.fetch).not.toHaveBeenCalled();
    expect(windowFetchSpy).toHaveBeenCalledOnce();
  });

  it('should fall back to base Fetch when the module fails to resolve', async () => {
    ShopifyPartialsFetch.__loadPartialsModule = async () => {
      throw new Error('Cannot find module @shopify/partial-rendering');
    };
    const windowFetchSpy = vi.spyOn(window, 'fetch');
    windowFetchSpy.mockImplementation(() =>
      Promise.resolve(new Response('<div id="test">new content</div>')),
    );

    const container = h('div', { id: 'container' }, [h('div', { id: 'test' }, ['old content'])]);
    document.body.appendChild(container);

    const anchor = h('a', {
      href: 'https://example.com',
      dataOptionPartials: ['product-grid'],
    });
    const fetch = new ShopifyPartialsFetch(anchor);

    await mount(fetch);
    await fetch.fetch(new URL('https://example.com'));
    // Wait for the fire-and-forget update phase to settle.
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(windowFetchSpy).toHaveBeenCalledOnce();
    // The base id-based full-page swap must actually run on the fallback path.
    expect(document.getElementById('test')?.textContent).toBe('new content');

    container.remove();
  });

  it('should fall back to base Fetch when the module has no partials export', async () => {
    ShopifyPartialsFetch.__loadPartialsModule = async () => ({}) as any;
    const windowFetchSpy = vi.spyOn(window, 'fetch');
    windowFetchSpy.mockImplementation(() => Promise.resolve(new Response('<div id="test">ok</div>')));

    const anchor = h('a', {
      href: 'https://example.com',
      dataOptionPartials: ['product-grid'],
    });
    const fetch = new ShopifyPartialsFetch(anchor);

    await mount(fetch);
    await fetch.fetch(new URL('https://example.com'));

    expect(windowFetchSpy).toHaveBeenCalledOnce();
  });

  it('should emit lifecycle events in order without emitting RESPONSE', async () => {
    useFakePartials();
    const anchor = h('a', {
      href: 'https://example.com',
      dataOptionPartials: ['product-grid'],
    });
    const fetch = new ShopifyPartialsFetch(anchor);
    const eventLog: string[] = [];

    for (const event of Object.values(ShopifyPartialsFetch.FETCH_EVENTS)) {
      fetch.$on(event as string, () => eventLog.push(event as string));
    }

    await mount(fetch);
    await fetch.fetch(new URL('https://example.com'));

    expect(eventLog).toEqual([
      ShopifyPartialsFetch.FETCH_EVENTS.BEFORE_FETCH,
      ShopifyPartialsFetch.FETCH_EVENTS.FETCH,
      ShopifyPartialsFetch.FETCH_EVENTS.AFTER_FETCH,
      ShopifyPartialsFetch.FETCH_EVENTS.BEFORE_UPDATE,
      ShopifyPartialsFetch.FETCH_EVENTS.UPDATE,
      ShopifyPartialsFetch.FETCH_EVENTS.AFTER_UPDATE,
    ]);
    expect(eventLog).not.toContain(ShopifyPartialsFetch.FETCH_EVENTS.RESPONSE);
  });
});
