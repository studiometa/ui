import { describe, it, expect, vi } from 'vitest';
import { Fetch } from '@studiometa/ui';
import { Window } from 'happy-dom';
import { h, mount } from '#test-utils';

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
      expect(fetchSpy).toHaveBeenCalledWith(fetch.url, fetch.requestInit);
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
