import { describe, it, expect, vi } from 'vitest';
import { Fetch } from '@studiometa/ui';
import { Window } from 'happy-dom';
import { h, mount, wait } from '#test-utils';

describe('The Fetch class', () => {
  describe('getters', () => {
    it('should have a `client` getter that returns the fetch function', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const spy = vi.spyOn(window, 'fetch');
      spy.mockImplementation(() => Promise.resolve(new Response('hi')));

      await fetch.client('#');
      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith('#');
      spy.mockRestore();
    });

    it('should have a `url` getter for links', async () => {
      const anchor = h('a', { href: 'https://example.com/test' });
      const fetch = new Fetch(anchor);
      await mount(fetch);

      expect(fetch.url).toEqual(new URL('https://example.com/test'));
    });

    it('should have a `url` getter for forms', async () => {
      const form = h('form', { action: 'https://example.com/submit', method: 'post' });
      const fetch = new Fetch(form);
      await mount(fetch);

      expect(fetch.url).toEqual(new URL('https://example.com/submit'));
    });

    it('should append form data to URL for GET forms', async () => {
      const input = h('input', { name: 'foo', value: 'bar' });
      const form = h('form', { action: 'https://example.com/submit', method: 'get' }, [input]);
      const fetch = new Fetch(form);
      await mount(fetch);

      expect(fetch.url.href).toBe('https://example.com/submit?foo=bar');
    });

    it('should fall back to the `src` option for the `url` getter on other elements', async () => {
      (window as any).happyDOM.setURL('https://example.com/');
      const div = h('div', { dataOptionSrc: '/src-path' });
      const fetch = new Fetch(div);
      await mount(fetch);

      expect(fetch.url).toEqual(new URL('https://example.com/src-path'));
    });

    it('should let the `src` option take precedence over a link `href`', async () => {
      (window as any).happyDOM.setURL('https://example.com/');
      const anchor = h('a', { href: 'https://example.com/href', dataOptionSrc: '/src-path' });
      const fetch = new Fetch(anchor);
      await mount(fetch);

      expect(fetch.url).toEqual(new URL('https://example.com/src-path'));
    });

    it('should let the `src` option take precedence over a form `action`', async () => {
      (window as any).happyDOM.setURL('https://example.com/');
      const form = h('form', {
        action: 'https://example.com/action',
        method: 'post',
        dataOptionSrc: '/src-path',
      });
      const fetch = new Fetch(form);
      await mount(fetch);

      expect(fetch.url).toEqual(new URL('https://example.com/src-path'));
    });

    it('should still fold GET form data onto a `src` base URL', async () => {
      (window as any).happyDOM.setURL('https://example.com/');
      const input = h('input', { name: 'q', value: 'foo' });
      const form = h(
        'form',
        { action: 'https://example.com/search', method: 'get', dataOptionSrc: '/search/suggest' },
        [input],
      );
      const fetch = new Fetch(form);
      await mount(fetch);

      expect(fetch.url.href).toBe('https://example.com/search/suggest?q=foo');
    });

    it('should preserve a fixed query in `src` alongside GET form data', async () => {
      (window as any).happyDOM.setURL('https://example.com/');
      const input = h('input', { name: 'q', value: 'foo' });
      const form = h(
        'form',
        {
          action: 'https://example.com/search',
          method: 'get',
          dataOptionSrc: '/search/suggest?section_id=predictive-search',
        },
        [input],
      );
      const fetch = new Fetch(form);
      await mount(fetch);

      expect(fetch.url.searchParams.get('section_id')).toBe('predictive-search');
      expect(fetch.url.searchParams.get('q')).toBe('foo');
    });

    it('should let GET form fields win over a conflicting query in `src`', async () => {
      (window as any).happyDOM.setURL('https://example.com/');
      const input = h('input', { name: 'q', value: 'live' });
      const form = h(
        'form',
        {
          action: 'https://example.com/search',
          method: 'get',
          dataOptionSrc: '/search/suggest?q=stale',
        },
        [input],
      );
      const fetch = new Fetch(form);
      await mount(fetch);

      expect(fetch.url.searchParams.get('q')).toBe('live');
    });

    it('should keep using the form `action` when `src` is empty', async () => {
      const input = h('input', { name: 'foo', value: 'bar' });
      const form = h('form', { action: 'https://example.com/submit', method: 'get' }, [input]);
      const fetch = new Fetch(form);
      await mount(fetch);

      expect(fetch.url.href).toBe('https://example.com/submit?foo=bar');
    });

    it('should keep every value of a repeated GET form field', async () => {
      // A checkbox group is repeated names by design. Setting each field on top of the
      // last left one value, so ticking a second box changed nothing.
      const one = h('input', { type: 'checkbox', name: 'genre[]', value: 'rock', checked: true });
      const two = h('input', { type: 'checkbox', name: 'genre[]', value: 'jazz', checked: true });
      const form = h('form', { action: 'https://example.com/search', method: 'get' }, [one, two]);
      const fetch = new Fetch(form);
      await mount(fetch);

      expect(fetch.url.searchParams.getAll('genre[]')).toEqual(['rock', 'jazz']);
    });

    it('should keep every value of a repeated field that has no brackets', async () => {
      // The bracket suffix is a PHP convention, not an HTML one: a repeated name is
      // repeated whether or not it ends in `[]`, so the fold cannot key on its shape.
      // `<select multiple>` is the other everyday case and is not covered here, because
      // happy-dom puts only the first selected option in FormData.
      const one = h('input', { name: 'genre', value: 'rock' });
      const two = h('input', { name: 'genre', value: 'jazz' });
      const form = h('form', { action: 'https://example.com/search', method: 'get' }, [one, two]);
      const fetch = new Fetch(form);
      await mount(fetch);

      expect(fetch.url.searchParams.getAll('genre')).toEqual(['rock', 'jazz']);
    });

    it('should let repeated GET form fields replace a conflicting query in `src`', async () => {
      // Both halves at once: the base's stale value goes, and both live values stay.
      (window as any).happyDOM.setURL('https://example.com/');
      const one = h('input', { type: 'checkbox', name: 'genre[]', value: 'rock', checked: true });
      const two = h('input', { type: 'checkbox', name: 'genre[]', value: 'jazz', checked: true });
      const form = h(
        'form',
        {
          action: 'https://example.com/search',
          method: 'get',
          dataOptionSrc: '/search/suggest?genre[]=stale&section=keep',
        },
        [one, two],
      );
      const fetch = new Fetch(form);
      await mount(fetch);

      expect(fetch.url.searchParams.getAll('genre[]')).toEqual(['rock', 'jazz']);
      expect(fetch.url.searchParams.get('section')).toBe('keep');
    });

    it('should have a `historyUrl` getter following the link `href` rather than `src`', async () => {
      (window as any).happyDOM.setURL('https://example.com/');
      const anchor = h('a', {
        href: 'https://example.com/projects/page/2?orderby=title',
        dataOptionSrc: '/projects/page/2?orderby=title&sections=listing',
      });
      const fetch = new Fetch(anchor);
      await mount(fetch);

      expect(fetch.url.searchParams.get('sections')).toBe('listing');
      expect(fetch.historyUrl.href).toBe('https://example.com/projects/page/2?orderby=title');
    });

    it('should fold GET form data onto the `action` for `historyUrl`', async () => {
      (window as any).happyDOM.setURL('https://example.com/');
      const input = h('input', { name: 'q', value: 'live' });
      const form = h(
        'form',
        {
          action: 'https://example.com/search',
          method: 'get',
          dataOptionSrc: '/search/suggest?sections=results',
        },
        [input],
      );
      const fetch = new Fetch(form);
      await mount(fetch);

      // The address bar has to show what the no-JS submit would have produced, filters
      // included — the bare action would drop them.
      expect(fetch.historyUrl.href).toBe('https://example.com/search?q=live');
      expect(fetch.url.searchParams.get('sections')).toBe('results');
    });

    it('should have a `historyUrl` equal to `url` when there is no `src`', async () => {
      const input = h('input', { name: 'foo', value: 'bar' });
      const form = h('form', { action: 'https://example.com/submit', method: 'get' }, [input]);
      const fetch = new Fetch(form);
      await mount(fetch);

      expect(fetch.historyUrl.href).toBe(fetch.url.href);
    });

    it('should have a `requestInit` getter', async () => {
      const headers = { 'x-foo': 'bar' };
      const init = { method: 'post' };
      const anchor = h('a', {
        href: 'https://example.com',
        dataOptionRequestInit: init,
        dataOptionHeaders: headers,
      });

      const fetch = new Fetch(anchor);
      await mount(fetch);

      expect(fetch.requestInit).toEqual({
        method: 'post',
        headers: {
          'user-agent': expect.stringContaining('@studiometa/ui/Fetch'),
          'x-foo': 'bar',
        },
      });
    });

    it('should include form data in requestInit for POST forms', async () => {
      const input = h('input', { name: 'test', value: 'value' });
      const form = h('form', { action: 'https://example.com/submit', method: 'post' }, [input]);
      const fetch = new Fetch(form);
      await mount(fetch);

      expect(fetch.requestInit.method).toBe('post');
      expect(fetch.requestInit.body).toBeInstanceOf(FormData);
    });

    it('should NOT include form data in requestInit for GET forms', async () => {
      const input = h('input', { name: 'test', value: 'value' });
      const form = h('form', { action: 'https://example.com/submit', method: 'get' }, [input]);
      const fetch = new Fetch(form);
      await mount(fetch);

      expect(fetch.requestInit.method).toBe('get');
      expect(fetch.requestInit.body).toBeUndefined();
    });

    it('should have an `isLink` getter', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const form = h('form', { action: 'https://example.com' });
      const fetchLink = new Fetch(anchor);
      const fetchForm = new Fetch(form);

      await mount(fetchLink, fetchForm);

      expect(fetchLink.isLink).toBe(true);
      expect(fetchForm.isLink).toBe(false);
    });

    it('should have an `isForm` getter', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const form = h('form', { action: 'https://example.com' });
      const fetchLink = new Fetch(anchor);
      const fetchForm = new Fetch(form);

      await mount(fetchLink, fetchForm);

      expect(fetchLink.isForm).toBe(false);
      expect(fetchForm.isForm).toBe(true);
    });
  });

  describe('event handlers', () => {
    it('should handle click on links and trigger fetch', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const fetchSpy = vi.spyOn(fetch, 'fetch');
      fetchSpy.mockImplementation(() => Promise.resolve());

      await mount(fetch);
      anchor.dispatchEvent(new MouseEvent('click', { button: 0 }));

      expect(fetchSpy).toHaveBeenCalledOnce();
      // No URL: the handler defers to the element, which is what lets `historyUrl`
      // differ from the requested one.
      expect(fetchSpy).toHaveBeenCalledWith(undefined, fetch.requestInit);
    });

    it('should not trigger fetch on link click with meta key', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const fetchSpy = vi.spyOn(fetch, 'fetch');
      fetchSpy.mockImplementation(() => Promise.resolve());

      await mount(fetch);
      anchor.dispatchEvent(new MouseEvent('click', { button: 0, metaKey: true }));

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should not trigger fetch on link click with ctrl key', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const fetchSpy = vi.spyOn(fetch, 'fetch');
      fetchSpy.mockImplementation(() => Promise.resolve());

      await mount(fetch);
      anchor.dispatchEvent(new MouseEvent('click', { button: 0, ctrlKey: true }));

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should not trigger fetch on link click with shift key', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const fetchSpy = vi.spyOn(fetch, 'fetch');
      fetchSpy.mockImplementation(() => Promise.resolve());

      await mount(fetch);
      anchor.dispatchEvent(new MouseEvent('click', { button: 0, shiftKey: true }));

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should not trigger fetch on link click with alt key', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const fetchSpy = vi.spyOn(fetch, 'fetch');
      fetchSpy.mockImplementation(() => Promise.resolve());

      await mount(fetch);
      anchor.dispatchEvent(new MouseEvent('click', { button: 0, altKey: true }));

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should not trigger fetch on non-primary button click', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const fetchSpy = vi.spyOn(fetch, 'fetch');
      fetchSpy.mockImplementation(() => Promise.resolve());

      await mount(fetch);
      anchor.dispatchEvent(new MouseEvent('click', { button: 1 }));

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should not trigger fetch on link with target="_blank"', async () => {
      const anchor = h('a', { href: 'https://example.com', target: '_blank' });
      const fetch = new Fetch(anchor);
      const fetchSpy = vi.spyOn(fetch, 'fetch');
      fetchSpy.mockImplementation(() => Promise.resolve());

      await mount(fetch);
      anchor.dispatchEvent(new MouseEvent('click', { button: 0 }));

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should not trigger fetch on click it not a link', async () => {
      const anchor = h('div', { href: 'https://example.com', target: '_blank' });
      const fetch = new Fetch(anchor);
      const fetchSpy = vi.spyOn(fetch, 'fetch');
      fetchSpy.mockImplementation(() => Promise.resolve());

      await mount(fetch);
      anchor.dispatchEvent(new MouseEvent('click', { button: 0 }));

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should handle form submit and trigger fetch', async () => {
      const form = h('form', { action: 'https://example.com/submit', method: 'post' });
      const fetch = new Fetch(form);
      const fetchSpy = vi.spyOn(fetch, 'fetch');
      fetchSpy.mockImplementation(() => Promise.resolve());

      await mount(fetch);
      form.dispatchEvent(new SubmitEvent('submit'));

      expect(fetchSpy).toHaveBeenCalledOnce();
    });

    it('should not trigger fetch on form submit with target="_blank"', async () => {
      const form = h('form', { action: 'https://example.com', target: '_blank' });
      const fetch = new Fetch(form);
      const fetchSpy = vi.spyOn(fetch, 'fetch');
      fetchSpy.mockImplementation(() => Promise.resolve());

      await mount(fetch);
      form.dispatchEvent(new SubmitEvent('submit'));

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should not trigger fetch on submit if not a form', async () => {
      const div = h('div', { action: 'https://example.com' });
      // needed as there is a check in @studiometa/js-toolkit if `on${event}` is defined or not
      // happy-dom keeps it undefined, so the `onSubmit` hook is never called on a div element.
      div.onsubmit = null;
      const fetch = new Fetch(div);
      const fetchSpy = vi.spyOn(fetch, 'fetch');
      fetchSpy.mockImplementation(() => Promise.resolve());

      await mount(fetch);
      div.dispatchEvent(new SubmitEvent('submit'));

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should handle window popstate event and trigger fetch', async () => {
      const anchor = h('a', { href: 'https://example.com', dataOptionHistory: true });
      const fetch = new Fetch(anchor);
      const fetchSpy = vi.spyOn(fetch, 'fetch');
      fetchSpy.mockImplementation(() => Promise.resolve());

      await mount(fetch);
      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(fetchSpy).toHaveBeenCalledOnce();
      expect(fetchSpy.mock.lastCall?.[1]).toEqual({
        headers: {
          'x-triggered-by': 'popstate',
        },
      });
    });
  });

  describe('fetch method', () => {
    it('should default to the `url` getter when called with no argument', async () => {
      const anchor = h('a', { href: 'https://example.com/no-arg' });
      const fetch = new Fetch(anchor);
      const clientSpy = vi.fn(() => Promise.resolve(new Response('content')));
      vi.spyOn(fetch, 'client', 'get').mockImplementation(() => clientSpy);

      await mount(fetch);
      await fetch.fetch();

      expect(clientSpy).toHaveBeenCalledWith(
        new URL('https://example.com/no-arg'),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    it('should resolve and fetch the `src` option URL when mounted on a `<div>`', async () => {
      (window as any).happyDOM.setURL('https://example.com/');
      const div = h('div', { dataOptionSrc: '/src-path' });
      const fetch = new Fetch(div);
      const clientSpy = vi.fn(() => Promise.resolve(new Response('content')));
      vi.spyOn(fetch, 'client', 'get').mockImplementation(() => clientSpy);

      await mount(fetch);
      await fetch.fetch();

      expect(clientSpy).toHaveBeenCalledWith(
        new URL('https://example.com/src-path'),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    it('should coerce a string URL argument into a URL object', async () => {
      (window as any).happyDOM.setURL('https://example.com/');
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const clientSpy = vi.fn(() => Promise.resolve(new Response('content')));
      vi.spyOn(fetch, 'client', 'get').mockImplementation(() => clientSpy);
      const updateSpy = vi.spyOn(fetch, 'update');

      await mount(fetch);
      await fetch.fetch('/relative/path');

      const expectedUrl = new URL('https://example.com/relative/path');
      expect(clientSpy).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
      // The normalized `URL` (not the raw string) is threaded through to `update`.
      expect(updateSpy).toHaveBeenCalledWith(expectedUrl, expect.any(Object), 'content');
    });

    it('should emit before-fetch event', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const fn = vi.fn();
      fetch.$on('fetch-before', (event: CustomEvent) => fn(...event.detail));

      const clientSpy = vi.fn(() => Promise.resolve(new Response('content')));
      vi.spyOn(fetch, 'client', 'get').mockImplementation(() => clientSpy);

      await mount(fetch);
      await fetch.fetch(new URL('https://example.com'));

      expect(fn).toHaveBeenCalled();
    });

    it('should emit fetch event', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const fn = vi.fn();
      fetch.$on('fetch-fetch', (event: CustomEvent) => fn(...event.detail));

      const clientSpy = vi.fn(() => Promise.resolve(new Response('content')));
      vi.spyOn(fetch, 'client', 'get').mockImplementation(() => clientSpy);

      await mount(fetch);
      await fetch.fetch(new URL('https://example.com'));

      expect(fn).toHaveBeenCalled();
    });

    it('should emit fetch-response event', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const fn = vi.fn();
      fetch.$on('fetch-response', (event: CustomEvent) => fn(...event.detail));

      const response = new Response('content');
      const clientSpy = vi.fn(() => Promise.resolve(response));
      vi.spyOn(fetch, 'client', 'get').mockImplementation(() => clientSpy);

      await mount(fetch);
      await fetch.fetch(new URL('https://example.com'));

      expect(fn).toHaveBeenCalledWith({
        response,
        instance: expect.any(Fetch),
        url: expect.any(URL),
        requestInit: expect.any(Object),
      });
    });

    it('should emit after-fetch event', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const fn = vi.fn();
      fetch.$on('fetch-after', (event: CustomEvent) => fn(...event.detail));

      const clientSpy = vi.fn(() => Promise.resolve(new Response('content')));
      vi.spyOn(fetch, 'client', 'get').mockImplementation(() => clientSpy);

      await mount(fetch);
      await fetch.fetch(new URL('https://example.com'));

      expect(fn).toHaveBeenCalled();
    });

    it('should call the client with correct URL and options', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const clientSpy = vi.fn(() => Promise.resolve(new Response('content')));
      vi.spyOn(fetch, 'client', 'get').mockImplementation(() => clientSpy);

      await mount(fetch);
      const url = new URL('https://example.com/test');
      await fetch.fetch(url);

      expect(clientSpy).toHaveBeenCalledWith(
        url,
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    it('should abort previous fetch when a new one is initiated', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);

      const clientSpy = vi.fn(() => Promise.resolve(new Response('content')));
      vi.spyOn(fetch, 'client', 'get').mockImplementation(() => clientSpy);

      await mount(fetch);

      const abortSpy = vi.spyOn(fetch['__abortController'], 'abort');

      // First fetch
      fetch.fetch(new URL('https://example.com'));
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Second fetch should abort the first one
      fetch.fetch(new URL('https://example.com'));

      expect(abortSpy).toHaveBeenCalled();
    });

    it('should use the response option to extract content', async () => {
      const anchor = h('a', {
        href: 'https://example.com',
        dataOptionResponse: 'response.json().then((data) => data.content)',
      });
      const fetch = new Fetch(anchor);
      const response = Response.json({
        content: '<div>content</div>',
      });

      const responseSpy = vi.spyOn(response, 'json');
      const clientSpy = vi.fn(() => Promise.resolve(response));
      vi.spyOn(fetch, 'client', 'get').mockImplementation(() => clientSpy);
      const updateSpy = vi.spyOn(fetch, 'update');

      await mount(fetch);
      const url = new URL('https://example.com');
      await fetch.fetch(url);

      expect(responseSpy).toHaveBeenCalled();
      expect(updateSpy).toHaveBeenCalledWith(url, expect.any(Object), '<div>content</div>');
    });

    it('should catch errors from the response option callback', async () => {
      const anchor = h('a', {
        href: 'https://example.com',
        dataOptionResponse: 'response.json().then(({ foo }) => foo.content)',
      });
      const fetch = new Fetch(anchor);
      const response = Response.json({
        content: '<div>content</div>',
      });
      const responseSpy = vi.spyOn(response, 'json');
      const clientSpy = vi.fn(() => Promise.resolve(response));
      vi.spyOn(fetch, 'client', 'get').mockImplementation(() => clientSpy);
      const updateSpy = vi.spyOn(fetch, 'update');

      const fn = vi.fn();
      fetch.$on('fetch-error', (event: CustomEvent) => fn(...event.detail));

      await mount(fetch);
      const url = new URL('https://example.com');
      await fetch.fetch(url);

      expect(responseSpy).toHaveBeenCalled();
      expect(updateSpy).not.toHaveBeenCalled();

      expect(fn).toHaveBeenCalledWith({
        // TypeError: Cannot read properties of undefined (reading 'content')
        error: expect.any(TypeError),
        instance: expect.any(Fetch),
        url: expect.any(URL),
        requestInit: expect.any(Object),
      });
    });
  });

  describe('abort method', () => {
    it('should abort the current request', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const updateSpy = vi.spyOn(fetch, 'update');

      const clientSpy = vi.fn(
        (url, { signal }) =>
          new Promise((resolve, reject) => {
            signal.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          }),
      );
      vi.spyOn(fetch, 'client', 'get').mockImplementation(() => clientSpy);

      await mount(fetch);
      setTimeout(() => fetch.abort(), 1);
      await fetch.fetch(new URL('https://example.com'));

      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe('update method', () => {
    it('should emit before-update event', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const fn = vi.fn();
      fetch.$on('fetch-update-before', (event: CustomEvent) => fn(...event.detail));

      await mount(fetch);
      await fetch.update(new URL('https://example.com'), {}, '<div id="test">content</div>');

      expect(fn).toHaveBeenCalled();
    });

    it('should emit update event', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const fn = vi.fn();
      fetch.$on('fetch-update', (event: CustomEvent) => fn(...event.detail));

      await mount(fetch);
      await fetch.update(new URL('https://example.com'), {}, '<div id="test">content</div>');

      expect(fn).toHaveBeenCalled();
    });

    it('should emit after-update event', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const fn = vi.fn();
      fetch.$on('fetch-update-after', (event: CustomEvent) => fn(...event.detail));

      await mount(fetch);
      await fetch.update(new URL('https://example.com'), {}, '<div id="test">content</div>');

      expect(fn).toHaveBeenCalled();
    });

    it('should update document title if history is enabled', async () => {
      const anchor = h('a', { href: 'https://example.com', dataOptionHistory: true });
      const fetch = new Fetch(anchor);
      const historySpy = vi.spyOn(window.history, 'pushState');
      historySpy.mockImplementation(() => undefined);

      await mount(fetch);
      const originalTitle = document.title;

      await fetch.update(
        new URL('https://example.com/?foo=bar'),
        {},
        '<head><title>New Title</title></head><body><div id="test">content</div></body>',
      );

      expect(document.title).toBe('New Title');
      document.title = originalTitle;
      historySpy.mockRestore();
    });

    it('should push history state if history is enabled and not from popstate', async () => {
      const anchor = h('a', { href: 'https://example.com', dataOptionHistory: true });
      const fetch = new Fetch(anchor);
      const historySpy = vi.spyOn(window.history, 'pushState');
      historySpy.mockImplementation(() => undefined);

      await mount(fetch);
      await fetch.update(
        new URL('https://example.com/?foo=bar'),
        {},
        '<div id="test">content</div>',
      );

      expect(historySpy).toHaveBeenCalledOnce();
      expect(historySpy).toHaveBeenCalledWith({}, '', '/?foo=bar');
      historySpy.mockRestore();
    });

    it('should push the element destination rather than the fetched `src`', async () => {
      (window as any).happyDOM.setURL('https://example.com/');
      const anchor = h('a', {
        href: 'https://example.com/projects/page/2?orderby=title',
        dataOptionSrc: '/projects/page/2?orderby=title&sections=listing',
        dataOptionHistory: true,
      });
      const fetch = new Fetch(anchor);
      const clientSpy = vi.fn(() => Promise.resolve(new Response('<div id="test">content</div>')));
      vi.spyOn(fetch, 'client', 'get').mockImplementation(() => clientSpy);
      const historySpy = vi.spyOn(window.history, 'pushState');
      historySpy.mockImplementation(() => undefined);

      await mount(fetch);
      await fetch.fetch();

      // Requested the lighter endpoint…
      expect(clientSpy).toHaveBeenCalledWith(
        new URL('https://example.com/projects/page/2?orderby=title&sections=listing'),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
      // …and left a URL somebody can copy.
      expect(historySpy).toHaveBeenCalledWith({}, '', '/projects/page/2?orderby=title');
      historySpy.mockRestore();
    });

    it('should push the destination when a link is clicked, not only on a bare fetch()', async () => {
      // The declarative path is the one people use, and it was the one the first version
      // of this missed: `onClick` passed `this.url` on, which reads as a caller naming a
      // destination and put the `src` back in the address bar.
      (window as any).happyDOM.setURL('https://example.com/');
      const anchor = h('a', {
        href: 'https://example.com/projects/page/2?orderby=title',
        dataOptionSrc: '/projects/page/2?orderby=title&sections=listing',
        dataOptionHistory: true,
      });
      const fetch = new Fetch(anchor);
      const clientSpy = vi.fn(() => Promise.resolve(new Response('<div id="test">content</div>')));
      vi.spyOn(fetch, 'client', 'get').mockImplementation(() => clientSpy);
      const historySpy = vi.spyOn(window.history, 'pushState');
      historySpy.mockImplementation(() => undefined);

      await mount(fetch);
      anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      await wait(50);

      expect(clientSpy).toHaveBeenCalledWith(
        new URL('https://example.com/projects/page/2?orderby=title&sections=listing'),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
      expect(historySpy).toHaveBeenCalledWith({}, '', '/projects/page/2?orderby=title');
      historySpy.mockRestore();
    });

    it('should push the destination when a GET form is submitted', async () => {
      (window as any).happyDOM.setURL('https://example.com/');
      const input = h('input', { name: 'q', value: 'live' });
      const form = h(
        'form',
        {
          action: 'https://example.com/search',
          method: 'get',
          dataOptionSrc: '/search/suggest?sections=results',
          dataOptionHistory: true,
        },
        [input],
      );
      const fetch = new Fetch(form);
      const clientSpy = vi.fn(() => Promise.resolve(new Response('<div id="test">content</div>')));
      vi.spyOn(fetch, 'client', 'get').mockImplementation(() => clientSpy);
      const historySpy = vi.spyOn(window.history, 'pushState');
      historySpy.mockImplementation(() => undefined);

      await mount(fetch);
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await wait(50);

      expect(historySpy).toHaveBeenCalledWith({}, '', '/search?q=live');
      historySpy.mockRestore();
    });

    it('should push a URL given to `fetch()` rather than the element destination', async () => {
      (window as any).happyDOM.setURL('https://example.com/');
      const anchor = h('a', { href: 'https://example.com/from-href', dataOptionHistory: true });
      const fetch = new Fetch(anchor);
      const clientSpy = vi.fn(() => Promise.resolve(new Response('<div id="test">content</div>')));
      vi.spyOn(fetch, 'client', 'get').mockImplementation(() => clientSpy);
      const historySpy = vi.spyOn(window.history, 'pushState');
      historySpy.mockImplementation(() => undefined);

      await mount(fetch);
      await fetch.fetch('/called-explicitly');

      // A caller that named a URL meant that URL, in the address bar as well.
      expect(historySpy).toHaveBeenCalledWith({}, '', '/called-explicitly');
      historySpy.mockRestore();
    });

    it('should not push history on popstate', async () => {
      const anchor = h('a', { href: 'https://example.com', dataOptionHistory: true });
      const fetch = new Fetch(anchor);
      const historySpy = vi.spyOn(window.history, 'pushState');
      historySpy.mockImplementation(() => undefined);

      await mount(fetch);
      await fetch.update(
        new URL('https://example.com/'),
        {
          headers: {
            'x-triggered-by': 'popstate',
          },
        },
        '<div id="test">content</div>',
      );

      expect(historySpy).not.toHaveBeenCalled();
      historySpy.mockRestore();
    });

    it('should update DOM with only the given selectors', async () => {
      const container = h('div', { id: 'container' }, [h('div', { id: 'test' }, ['old content'])]);
      document.body.appendChild(container);

      const anchor = h('a', { href: 'https://example.com', dataOptionSelector: 'div' });
      const fetch = new Fetch(anchor);

      await mount(fetch);
      await fetch.update(
        new URL('https://example.com'),
        {},
        '<div id="test">new content</div><div id="other">other content</div>',
      );

      const element = document.getElementById('test');
      expect(element?.textContent).toBe('new content');

      container.remove();
    });

    it('should not inject already injected new DOM elements', async () => {
      const container = h('div', { id: 'container' }, [
        'container content',
        h('div', { id: 'test' }, ['old content']),
      ]);
      document.body.appendChild(container);

      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);

      await mount(fetch);
      await fetch.update(
        new URL('https://example.com'),
        {},
        `
          <div id="container" class="foo">
            new container content
            <div id="test">new content</div>
            <div id="other">other content</div>
          </div>`,
      );

      const newContainer = document.getElementById('container');
      expect(newContainer.outerHTML).toMatchInlineSnapshot(`
        "<div id="container" class="foo">
                    new container content
                    <div id="test">new content</div>
                    <div id="other">other content</div>
                  </div>"
      `);

      newContainer.remove();
    });

    it('should update DOM with replace mode (default)', async () => {
      const container = h('div', { id: 'container' }, [h('div', { id: 'test' }, ['old content'])]);
      document.body.appendChild(container);

      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);

      await mount(fetch);
      await fetch.update(new URL('https://example.com'), {}, '<div id="test">new content</div>');

      const element = document.getElementById('test');
      expect(element?.textContent).toBe('new content');

      container.remove();
    });

    it('should update DOM with append mode', async () => {
      const container = h('div', { id: 'container' }, [h('div', { id: 'test' }, ['old content'])]);
      document.body.appendChild(container);

      const anchor = h('a', {
        href: 'https://example.com',
        dataOptionMode: 'append',
      });
      const fetch = new Fetch(anchor);

      await mount(fetch);
      await fetch.update(new URL('https://example.com'), {}, '<div id="test">new content</div>');

      const element = document.getElementById('test');
      expect(element?.textContent).toContain('old content');
      expect(element?.textContent).toContain('new content');

      container.remove();
    });

    it('should update DOM with prepend mode', async () => {
      const container = h('div', { id: 'container' }, [h('div', { id: 'test' }, ['old content'])]);
      document.body.appendChild(container);

      const anchor = h('a', {
        href: 'https://example.com',
        dataOptionMode: 'prepend',
      });
      const fetch = new Fetch(anchor);

      await mount(fetch);
      await fetch.update(new URL('https://example.com'), {}, '<div id="test">new content</div>');

      const element = document.getElementById('test');
      expect(element?.textContent).toContain('old content');
      expect(element?.textContent).toContain('new content');

      container.remove();
    });

    it('should update DOM with morph mode', async () => {
      const container = h('div', { id: 'container' }, [h('div', { id: 'test' }, ['old content'])]);
      document.body.appendChild(container);

      const anchor = h('a', {
        href: 'https://example.com',
        dataOptionMode: 'morph',
      });
      const fetch = new Fetch(anchor);

      await mount(fetch);
      await fetch.update(new URL('https://example.com'), {}, '<div id="test">new content</div>');

      const element = document.getElementById('test');
      expect(element?.textContent).toBe('new content');

      container.remove();
    });

    it('should inject <script> elements with an id', async () => {
      const spy = vi.spyOn(console, 'info');
      spy.mockImplementation(() => {});
      const oldDocument = globalThis.document;
      const { document } = new Window({
        console,
        settings: {
          enableJavaScriptEvaluation: true,
          suppressInsecureJavaScriptEnvironmentWarning: true,
        },
      });
      globalThis.document = document;

      const oldScript = h('script', { id: 'js' }, 'console.info("old");');
      const inertScript = h('script', { id: 'js2' }, 'console.info("inert");');
      const container = h('div', { id: 'container' }, [oldScript, inertScript]);
      document.body.appendChild(container);

      const anchor = h('a', {
        href: 'https://example.com',
      });
      const fetch = new Fetch(anchor);

      await mount(fetch);
      await fetch.update(
        new URL('https://example.com'),
        {},
        '<script id="js">console.info("new");</script>',
      );

      expect(spy.mock.calls.flat()).toEqual(['old', 'inert', 'new']);
      expect(container.innerHTML).toMatchInlineSnapshot(
        `"<script id="js">console.info("new");</script><script id="js2">console.info("inert");</script>"`,
      );
      spy.mockRestore();

      container.remove();
      globalThis.document = oldDocument;
    });

    it('should not reevaluate existing <script> elements', async () => {
      const spy = vi.spyOn(console, 'info');
      spy.mockImplementation(() => {});
      const oldDocument = globalThis.document;
      const { document } = new Window({
        console,
        settings: {
          enableJavaScriptEvaluation: true,
          suppressInsecureJavaScriptEnvironmentWarning: true,
        },
      });
      globalThis.document = document;

      const oldScript = h('script', 'console.info("old");');
      const inertScript = h('script', 'console.info("inert");');
      const container = h('div', { id: 'container' }, [oldScript, inertScript]);
      document.body.appendChild(container);

      const anchor = h('a', {
        href: 'https://example.com',
        dataOptionMode: Fetch.FETCH_MODES.APPEND,
      });
      const fetch = new Fetch(anchor);

      await mount(fetch);
      await fetch.update(
        new URL('https://example.com'),
        {},
        '<div id="container"><script>console.info("new");</script></div>',
      );

      expect(spy.mock.calls.flat()).toEqual(['old', 'inert', 'new']);
      spy.mockRestore();

      container.remove();
      globalThis.document = oldDocument;
    });

    it('should use View Transition API if supported', async () => {
      const container = h('div', { id: 'container' }, [h('div', { id: 'test' }, ['old content'])]);
      document.body.appendChild(container);

      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);

      await mount(fetch);

      const updateDOMSpy = vi.spyOn(fetch, '__updateDOM');
      const transitionSpy = vi.fn((callback: () => void) => {
        callback();
        return {
          ready: Promise.resolve(),
          finished: Promise.resolve(),
        };
      });
      Object.defineProperty(document, 'startViewTransition', {
        value: transitionSpy,
        configurable: true,
      });

      await fetch.update(new URL('https://example.com'), {}, '<div id="test">new content</div>');

      expect(transitionSpy).toHaveBeenCalled();
      expect(updateDOMSpy).toHaveBeenCalled();

      // Clean up
      delete (document as any).startViewTransition;
      container.remove();
    });

    it('should not use View Transition API if disabled', async () => {
      const container = h('div', { id: 'container' }, [h('div', { id: 'test' }, ['old content'])]);
      document.body.appendChild(container);

      const anchor = h('a', { href: 'https://example.com', dataOptionNoViewTransition: '' });
      const fetch = new Fetch(anchor);

      await mount(fetch);

      const updateDOMSpy = vi.spyOn(fetch, '__updateDOM');
      const transitionSpy = vi.fn((callback: () => void) => {
        callback();
        return {
          ready: Promise.resolve(),
          finished: Promise.resolve(),
        };
      });
      Object.defineProperty(document, 'startViewTransition', {
        value: transitionSpy,
        configurable: true,
      });

      await fetch.update(new URL('https://example.com'), {}, '<div id="test">new content</div>');

      expect(transitionSpy).not.toHaveBeenCalled();
      expect(updateDOMSpy).toHaveBeenCalled();

      // Clean up
      delete (document as any).startViewTransition;
      container.remove();
    });

    it('should batch simultaneous updates into a single view transition', async () => {
      const container = h('div', { id: 'container' }, [
        h('div', { id: 'test' }, ['old content']),
        h('div', { id: 'other' }, ['old other']),
      ]);
      document.body.appendChild(container);

      const fetchA = new Fetch(h('a', { href: 'https://example.com' }));
      const fetchB = new Fetch(h('a', { href: 'https://example.com' }));
      await mount(fetchA, fetchB);

      const transitionSpy = vi.fn((callback: () => void | Promise<void>) => {
        callback();
        return {
          ready: Promise.resolve(),
          finished: Promise.resolve(),
        };
      });
      Object.defineProperty(document, 'startViewTransition', {
        value: transitionSpy,
        configurable: true,
      });

      await Promise.all([
        fetchA.update(new URL('https://example.com'), {}, '<div id="test">new content</div>'),
        fetchB.update(new URL('https://example.com'), {}, '<div id="other">new other</div>'),
      ]);

      // The shared scheduler flushed both updates in ONE view transition.
      expect(transitionSpy).toHaveBeenCalledTimes(1);
      expect(document.getElementById('test')?.textContent).toBe('new content');
      expect(document.getElementById('other')?.textContent).toBe('new other');

      // Clean up
      delete (document as any).startViewTransition;
      container.remove();
    });

    it('should let a `dom-update` runner substitute the default transition runner', async () => {
      const container = h('div', { id: 'container' }, [h('div', { id: 'test' }, ['old content'])]);
      document.body.appendChild(container);

      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);

      await mount(fetch);

      const transitionSpy = vi.fn((callback: () => void) => {
        callback();
        return {
          ready: Promise.resolve(),
          finished: Promise.resolve(),
        };
      });
      Object.defineProperty(document, 'startViewTransition', {
        value: transitionSpy,
        configurable: true,
      });

      let contentBeforeApply: string | undefined;
      let contentAfterApply: string | undefined;
      fetch.$on('dom-update', (event: CustomEvent) => {
        event.detail.wrap((apply: () => void) => {
          contentBeforeApply = document.getElementById('test')?.textContent;
          apply();
          contentAfterApply = document.getElementById('test')?.textContent;
        });
      });

      await fetch.update(new URL('https://example.com'), {}, '<div id="test">new content</div>');

      expect(contentBeforeApply).toBe('old content');
      expect(contentAfterApply).toBe('new content');
      expect(transitionSpy).not.toHaveBeenCalled();

      // Clean up
      delete (document as any).startViewTransition;
      container.remove();
    });

    it('should let a `dom-update` transitioner run the update through its `update` method', async () => {
      const container = h('div', { id: 'container' }, [h('div', { id: 'test' }, ['old content'])]);
      document.body.appendChild(container);

      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);

      await mount(fetch);

      let contentAfterMutate: string | undefined;
      const update = vi.fn((mutate: () => void) => {
        mutate();
        contentAfterMutate = document.getElementById('test')?.textContent;
      });
      fetch.$on('dom-update', (event: CustomEvent) => {
        event.detail.wrap({ update });
      });

      await fetch.update(new URL('https://example.com'), {}, '<div id="test">new content</div>');

      expect(update).toHaveBeenCalledOnce();
      expect(update).toHaveBeenCalledWith(expect.any(Function));
      expect(contentAfterMutate).toBe('new content');
      expect(document.getElementById('test')?.textContent).toBe('new content');

      container.remove();
    });

    it('should keep the last `wrap` runner registered during dispatch', async () => {
      const container = h('div', { id: 'container' }, [h('div', { id: 'test' }, ['old content'])]);
      document.body.appendChild(container);

      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);

      await mount(fetch);

      const firstRunner = vi.fn((apply: () => void) => apply());
      const lastRunner = vi.fn((apply: () => void) => apply());
      fetch.$on('dom-update', (event: CustomEvent) => {
        event.detail.wrap(firstRunner);
        event.detail.wrap(lastRunner);
      });

      await fetch.update(new URL('https://example.com'), {}, '<div id="test">new content</div>');

      expect(firstRunner).not.toHaveBeenCalled();
      expect(lastRunner).toHaveBeenCalledOnce();
      expect(document.getElementById('test')?.textContent).toBe('new content');

      container.remove();
    });

    it('should ignore and warn on `wrap` calls after the `dom-update` event dispatched', async () => {
      const container = h('div', { id: 'container' }, [h('div', { id: 'test' }, ['old content'])]);
      document.body.appendChild(container);

      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const warnFn = vi.fn();
      Object.defineProperty(fetch, '$warn', { configurable: true, get: () => warnFn });

      await mount(fetch);

      let wrap: (runner: (apply: () => void) => void) => void;
      fetch.$on('dom-update', (event: CustomEvent) => {
        wrap = event.detail.wrap;
      });

      await fetch.update(new URL('https://example.com'), {}, '<div id="test">new content</div>');

      // The default path ran since no runner was registered during dispatch.
      expect(document.getElementById('test')?.textContent).toBe('new content');

      const lateRunner = vi.fn();
      wrap(lateRunner);

      expect(lateRunner).not.toHaveBeenCalled();
      expect(warnFn).toHaveBeenCalledWith(
        '`wrap` must be called synchronously while the `dom-update` event dispatches.',
      );

      container.remove();
    });

    it('should apply the content and warn when a `wrap` runner rejects', async () => {
      const container = h('div', { id: 'container' }, [h('div', { id: 'test' }, ['old content'])]);
      document.body.appendChild(container);

      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const warnFn = vi.fn();
      Object.defineProperty(fetch, '$warn', { configurable: true, get: () => warnFn });
      const fn = vi.fn();
      fetch.$on('fetch-update-after', () => fn());

      await mount(fetch);

      const error = new Error('Runner failed');
      fetch.$on('dom-update', (event: CustomEvent) => {
        event.detail.wrap(() => Promise.reject(error));
      });

      await fetch.update(new URL('https://example.com'), {}, '<div id="test">new content</div>');

      expect(document.getElementById('test')?.textContent).toBe('new content');
      expect(warnFn).toHaveBeenCalledWith('The `dom-update` runner rejected.', error);
      expect(fn).toHaveBeenCalled();

      container.remove();
    });

    it('should apply the content and warn when a `wrap` runner throws synchronously', async () => {
      const container = h('div', { id: 'container' }, [h('div', { id: 'test' }, ['old content'])]);
      document.body.appendChild(container);

      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const warnFn = vi.fn();
      Object.defineProperty(fetch, '$warn', { configurable: true, get: () => warnFn });
      const fn = vi.fn();
      fetch.$on('fetch-update-after', () => fn());

      await mount(fetch);

      const error = new Error('Runner failed');
      fetch.$on('dom-update', (event: CustomEvent) => {
        event.detail.wrap(() => {
          throw error;
        });
      });

      await fetch.update(new URL('https://example.com'), {}, '<div id="test">new content</div>');

      expect(document.getElementById('test')?.textContent).toBe('new content');
      expect(warnFn).toHaveBeenCalledWith('The `dom-update` runner rejected.', error);
      expect(fn).toHaveBeenCalled();

      container.remove();
    });

    it('should not apply the content twice when a `wrap` runner rejects after applying', async () => {
      const container = h('div', { id: 'container' }, [h('div', { id: 'test' }, ['old content'])]);
      document.body.appendChild(container);

      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const warnFn = vi.fn();
      Object.defineProperty(fetch, '$warn', { configurable: true, get: () => warnFn });
      const updateDOMSpy = vi.spyOn(fetch, '__updateDOM');

      await mount(fetch);

      const error = new Error('Runner failed');
      fetch.$on('dom-update', (event: CustomEvent) => {
        event.detail.wrap((apply: () => void) => {
          apply();
          return Promise.reject(error);
        });
      });

      await fetch.update(new URL('https://example.com'), {}, '<div id="test">new content</div>');

      expect(document.getElementById('test')?.textContent).toBe('new content');
      expect(updateDOMSpy).toHaveBeenCalledOnce();
      expect(warnFn).toHaveBeenCalledWith('The `dom-update` runner rejected.', error);

      container.remove();
    });
  });

  describe('error handling', () => {
    it('should emit error event on fetch failure', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const fn = vi.fn();
      fetch.$on('fetch-error', (event: CustomEvent) => fn(...event.detail));

      const fetchError = new Error('Network error');
      const clientSpy = vi.fn(() => Promise.reject(fetchError));
      vi.spyOn(fetch, 'client', 'get').mockImplementation(() => clientSpy);

      await mount(fetch);
      await fetch.fetch(new URL('https://example.com'));

      expect(fn).toHaveBeenCalledWith({
        error: fetchError,
        instance: expect.any(Fetch),
        url: expect.any(URL),
        requestInit: expect.any(Object),
      });
    });

    it('should emit error event on response ko', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const fn = vi.fn();
      fetch.$on('fetch-error', (event: CustomEvent) => fn(...event.detail));

      const fetchResponse = new Response('Network error', { status: 404 });
      const clientSpy = vi.fn(() => Promise.resolve(fetchResponse));
      vi.spyOn(fetch, 'client', 'get').mockImplementation(() => clientSpy);

      await mount(fetch);
      await fetch.fetch(new URL('https://example.com'));

      expect(fn).toHaveBeenCalledWith({
        error: expect.any(Error),
        instance: expect.any(Fetch),
        url: expect.any(URL),
        requestInit: expect.any(Object),
      });
    });

    it('should call error method on fetch failure', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const errorSpy = vi.spyOn(fetch, 'error');

      const fetchError = new Error('Network error');
      const clientSpy = vi.fn(() => Promise.reject(fetchError));
      vi.spyOn(fetch, 'client', 'get').mockImplementation(() => clientSpy);

      await mount(fetch);
      await fetch.fetch(new URL('https://example.com'));

      expect(errorSpy).toHaveBeenCalledOnce();
    });

    it('should still emit after-fetch on error', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const fn = vi.fn();
      fetch.$on('fetch-after', (event: CustomEvent) => fn(...event.detail));

      const fetchError = new Error('Network error');
      const clientSpy = vi.fn(() => Promise.reject(fetchError));
      vi.spyOn(fetch, 'client', 'get').mockImplementation(() => clientSpy);

      await mount(fetch);
      await fetch.fetch(new URL('https://example.com'));

      expect(fn).toHaveBeenCalled();
    });

    it('should emit fetch-abort on abort', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const fn = vi.fn();
      fetch.$on('fetch-abort', (event: CustomEvent) => fn(...event.detail));

      const clientSpy = vi.fn(
        (url, { signal }) =>
          new Promise((resolve, reject) => {
            signal.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          }),
      );
      vi.spyOn(fetch, 'client', 'get').mockImplementation(() => clientSpy);

      await mount(fetch);
      setTimeout(() => fetch.abort(), 1);
      await fetch.fetch(new URL('https://example.com'));

      expect(fn).toHaveBeenCalled();
    });
  });

  describe('events', () => {
    it('should emit all expected events in order', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const eventLog: string[] = [];

      for (const event of Object.values(Fetch.FETCH_EVENTS)) {
        fetch.$on(event as string, () => eventLog.push(event));
      }

      const clientSpy = vi.spyOn(fetch, 'client', 'get');
      clientSpy.mockImplementation(() => () => Promise.resolve(new Response('content')));

      await mount(fetch);
      await fetch.fetch(new URL('https://example.com'));
      // `fetch()` does not await `update()`, and the scheduled view transition
      // resolves in a later microtask: flush before asserting.
      await wait(0);

      expect(eventLog).toContain('fetch-before');
      expect(eventLog).toContain('fetch-fetch');
      expect(eventLog).toContain('fetch-after');
      expect(eventLog).toContain('fetch-update-before');
      expect(eventLog).toContain('fetch-update');
      expect(eventLog).toContain('fetch-update-after');
    });

    it('should emit bubbling events', async () => {
      const anchor = h('a', { href: 'https://example.com' });
      const fetch = new Fetch(anchor);
      const fn = vi.fn();

      document.body.appendChild(anchor);
      document.body.addEventListener('fetch-before', fn);

      const clientSpy = vi.spyOn(fetch, 'client', 'get');
      clientSpy.mockImplementation(() => Promise.resolve(new Response('content')));

      await mount(fetch);
      await fetch.fetch(new URL('https://example.com'));

      expect(fn).toHaveBeenCalled();

      document.body.removeEventListener('fetch-before', fn);
      anchor.remove();
    });
  });

  describe('header handling', () => {
    it('should merge headers from option, requestInit, and input elements', async () => {
      const headerInput = h('input', {
        dataRef: 'headers[]',
        dataName: 'x-custom',
        value: 'custom-value',
      });
      const otherInput = h('input', {
        dataRef: 'headers[]',
        value: 'other-value',
      });
      const form = h(
        'form',
        {
          action: 'https://example.com',
          method: 'post',
          dataOptionHeaders: { 'x-option': 'option-value' },
        },
        [headerInput, otherInput],
      );
      const fetch = new Fetch(form);

      await mount(fetch);
      const requestInit = fetch.requestInit;

      expect(requestInit.headers['x-custom']).toBe('custom-value');
      expect(requestInit.headers['x-option']).toBe('option-value');
      expect(requestInit.headers['user-agent']).toContain('@studiometa/ui/Fetch');
    });
  });
});
