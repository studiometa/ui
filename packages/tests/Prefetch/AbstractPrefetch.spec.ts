import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AbstractPrefetch } from '@studiometa/ui';
import { h, mount } from '#test-utils';

beforeEach(() => {
  AbstractPrefetch.prefetchedUrls = new Set();
});

describe('The AbstractPrefetch class', () => {
  it('should validate if a given URL is prefetchable', async () => {
    const anchor = h('a', { href: 'http://fqdn.com/' });
    const prefetch = new AbstractPrefetch(anchor);
    await mount(prefetch);

    const location = new URL('http://fqdn.com');
    const locationSpy = vi.spyOn(window, 'location', 'get');
    locationSpy.mockImplementation(() => location);

    const urls = [
      ['http://fqdn.com/', false],
      ['http://fqdn.com/#foo', false],
      ['http://fqdn.com/foo/bar', true],
      ['http://fqdn.net/foo/bar', false],
    ] as [string, boolean][];

    for (const [url, expected] of urls) {
      anchor.setAttribute('href', url);
      expect(prefetch.isPrefetchable).toBe(expected);
    }

    prefetch.$options.prefetch = false;
    expect(prefetch.isPrefetchable).toBe(false);

    anchor.removeAttribute('href');
    expect(prefetch.isPrefetchable).toBe(false);

    locationSpy.mockRestore();
  });

  it('should append a link prefetch element when prefetchable', async () => {
    const anchor = h('a', { href: 'http://fqdn.com/foo/bar' });
    const prefetch = new AbstractPrefetch(anchor);
    await mount(prefetch);

    const location = new URL('http://fqdn.com');
    const locationSpy = vi.spyOn(window, 'location', 'get');
    locationSpy.mockImplementation(() => location);

    prefetch.prefetch();
    const link = document.head.querySelector('link[rel="prefetch"]');
    expect(link).not.toBeNull();
    expect(link.href).toBe(anchor.href);

    prefetch.prefetch();
    expect(document.head.querySelectorAll('link[rel="prefetch"]')).toHaveLength(1);

    link.remove();

    anchor.href = 'https://fqdn.com/baz';
    const spy = vi.spyOn(prefetch, 'isPrefetchable', 'get');
    spy.mockImplementation(() => false);
    prefetch.prefetch();
    expect(document.head.querySelector('link[rel="prefetch"]')).toBeNull();
    locationSpy.mockRestore();
  });

  it('should NOT append a link prefetch element when NOT prefetchable', async () => {
    const anchor = h('a', { href: 'http://fqdn.com/foo/bar' });
    const prefetch = new AbstractPrefetch(anchor);
    await mount(prefetch);

    const location = new URL('http://fqdn.net');
    const locationSpy = vi.spyOn(window, 'location', 'get');
    locationSpy.mockImplementation(() => location);

    prefetch.prefetch();
    const link = document.head.querySelector('link[rel="prefetch"]');
    expect(link).toBeNull();

    locationSpy.mockRestore();
  });

  it('should emit a prefetched event when the prefetch has been done', async () => {
    const anchor = h('a', { href: 'http://fqdn.com/foo/bar' });
    const prefetch = new AbstractPrefetch(anchor);
    const fn = vi.fn();
    prefetch.$on('prefetched', ({ detail: [url] }) => fn(url));
    await mount(prefetch);

    const location = new URL('http://fqdn.com');
    const locationSpy = vi.spyOn(window, 'location', 'get');
    locationSpy.mockImplementation(() => location);

    prefetch.prefetch();
    const link = document.head.querySelector('link[rel="prefetch"]');
    expect(link).not.toBeNull();
    expect(link.href).toBe(anchor.href);
    link.dispatchEvent(new Event('load'));
    expect(fn).toHaveBeenCalledWith(prefetch.url);

    link.remove();
    locationSpy.mockRestore();
  });
});
