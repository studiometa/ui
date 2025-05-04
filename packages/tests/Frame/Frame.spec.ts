import { describe, it, expect, vi } from 'vitest';
import { Base, getInstanceFromElement } from '@studiometa/js-toolkit';
import { Frame, FrameAnchor, FrameLoader } from '@studiometa/ui';
import { h, mount } from '#test-utils';

describe('The Frame class', () => {
  it('should have an `id` getter', async () => {
    const div = h('div', { id: 'foo' });
    const frameTarget = new Frame(div);
    await mount(frameTarget);
    expect(frameTarget.id).toBe(div.id);
  });

  it('should have a `client` getter', async () => {
    const frameTarget = new Frame(h('div'));
    const spy = vi.spyOn(window, 'fetch');
    spy.mockImplementation(() => Promise.resolve(new Response('hi')));

    await frameTarget.client('#');
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith('#');
    spy.mockRestore();
  });

  it('should have a `requestInit` getter', async () => {
    const init = { method: 'post' };
    const headers = { 'x-foo': 'bar' };
    const div = h('div', { id: 'foo', dataOptionRequestInit: init, dataOptionHeaders: headers });
    const frameTarget = new Frame(div);
    await mount(frameTarget);
    expect(frameTarget.requestInit).toEqual({
      method: 'post',
      headers: {
        accept: 'text/*',
        'user-agent': `${navigator.userAgent} @studiometa/ui/Frame`,
        'x-requested-by': '@studiometa/ui/Frame',
        'x-foo': 'bar',
      },
    });
  });

  it('should be able to get its direct children', async () => {
    const nestedAnchor = h('a', { dataComponent: 'FrameAnchor', id: 'nested-anchor' });
    const nestedFrame = h('div', { dataComponent: 'Frame', id: 'nested-frame' }, [nestedAnchor]);
    const anchor = h('a', { dataComponent: 'FrameAnchor', id: 'anchor' });
    const frame = h('div', { dataComponent: 'Frame', id: 'frame' }, [anchor, nestedFrame]);
    const div = h('div', [frame]);

    class App extends Base {
      static config = {
        name: 'App',
        components: {
          Frame,
        },
      };
    }

    await mount(new App(div));
    expect(getInstanceFromElement(frame, Frame).getDirectChildren('FrameAnchor')).toHaveLength(1);
  });

  it('should listen to the frame-trigger events', async () => {
    const anchor = h('a', { dataComponent: 'FrameAnchor', href: '#' });
    const form = h('form', { dataComponent: 'FrameForm', href: '#' });
    const div = h('div', { id: 'frame' }, [anchor, form]);
    const frame = new Frame(div);
    const spy = vi.spyOn(frame, 'fetch');
    spy.mockImplementation(() => Promise.resolve());

    await mount(frame);
    anchor.dispatchEvent(new MouseEvent('click'));
    expect(spy).toHaveBeenCalledOnce();
    form.dispatchEvent(new SubmitEvent('submit'));
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should listen to the window popstate events', async () => {
    const frame = new Frame(h('div'));
    const spy = vi.spyOn(frame, 'fetch');
    spy.mockImplementation(() => Promise.resolve());
    await mount(frame);

    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.lastCall).toEqual([
      new URL(window.location.href),
      {
        headers: {
          [frame.headerNames.X_TRIGGERED_BY]: 'popstate',
        },
      },
    ]);
  });

  it('should trigger its FrameLoader child components', async () => {
    const loader = h('div', { dataComponent: 'FrameLoader' });
    const div = h('div', [loader]);
    const frame = new Frame(div);
    await mount(frame);

    const frameLoader = getInstanceFromElement(loader, FrameLoader);
    const enterSpy = vi.spyOn(frameLoader, 'enter');
    const leaveSpy = vi.spyOn(frameLoader, 'leave');
    frame.$emit('frame-fetch-before');
    expect(enterSpy).toHaveBeenCalledOnce();
    expect(leaveSpy).not.toHaveBeenCalledOnce();
    frame.$emit('frame-fetch-after');
    expect(enterSpy).toHaveBeenCalledOnce();
    expect(leaveSpy).toHaveBeenCalledOnce();
  });

  it('should trigger content update on its FrameTarget child components', async () => {
    const target = h('div', { dataComponent: 'FrameTarget', id: 'foo' }, ['hello world']);
    const div = h('div', { id: 'frame' }, [target]);
    const frame = new Frame(div);
    await mount(frame);

    await frame.content(
      new URL(`http://localhost/?foo=bar`),
      {},
      '<div data-component="FrameTarget" id="foo">Lorem ipsum</div>',
    );
    expect(target.textContent).toBe('Lorem ipsum');
  });

  it('should have an `history` option', async () => {
    const div = h('div', { id: 'frame', dataOptionHistory: true });
    const frame = new Frame(div);
    const historySpy = vi.spyOn(window.history, 'pushState');
    historySpy.mockImplementation(() => undefined);

    await mount(frame);
    await frame.content(
      new URL(`http://localhost/?foo=bar`),
      {},
      '<head><title>foo</title></head><body><div data-component="FrameTarget" id="foo">Lorem ipsum</div></body>',
    );

    expect(historySpy).toHaveBeenCalledOnce();
    expect(historySpy).toHaveBeenLastCalledWith({}, '', '/?foo=bar');
    expect(document.title).toBe('foo');

    await frame.content(
      new URL(`http://localhost/`),
      {
        headers: {
          [frame.headerNames.X_TRIGGERED_BY]: 'popstate',
        },
      },
      '<head><title>bar</title></head><body><div data-component="FrameTarget" id="foo">Lorem ipsum</div></body>',
    );
    expect(historySpy).toHaveBeenCalledOnce();
    expect(document.title).toBe('bar');

    historySpy.mockRestore();
  });

  it('should fetch content', async () => {
    const div = h('div', { id: 'frame' });
    const frame = new Frame(div);
    const clientSpy = vi.spyOn(frame, 'client');
    clientSpy.mockImplementation(() => Promise.resolve(new Response('hello world')));
    const contentSpy = vi.spyOn(frame, 'content');
    contentSpy.mockImplementation(() => Promise.resolve());
    await mount(frame);

    const url = new URL('https://localhost');
    await frame.fetch(url);
    expect(contentSpy).toHaveBeenCalledOnce();
    expect(contentSpy).toHaveBeenLastCalledWith(
      url,
      {
        ...frame.requestInit,
        signal: frame.abortController.signal,
      },
      'hello world',
    );
  });

  it('should trigger a root update', async () => {
    const div = h('div', { id: 'frame' });
    const frame = new Frame(div);
    await mount(frame);

    const updateSpy = vi.spyOn(frame.$root, '$update');

    await frame.content(new URL('http://localhost/'), {}, '<div id="frame">new content</div>');

    expect(updateSpy).toHaveBeenCalledOnce();
    updateSpy.mockRestore();
  });

  it('should handle errors', async () => {
    const div = h('div', { id: 'frame' });
    const frame = new Frame(div);
    await mount(frame);

    const errorSpy = vi.spyOn(frame, 'error');

    const fetchError = new Error('Fetch failed');
    const clientSpy = vi.spyOn(frame, 'client');
    clientSpy.mockImplementation(() => Promise.reject(fetchError));

    const url = new URL('https://localhost');
    const fn = vi.fn();
    frame.$on('frame-error', (event: CustomEvent) => fn(...event.detail));

    await frame.fetch(url);

    const params = [
      url,
      { ...frame.requestInit, signal: frame.abortController.signal },
      fetchError,
    ];
    expect(errorSpy).toHaveBeenCalledOnce();
    expect(errorSpy.mock.lastCall).toEqual(params);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn.mock.lastCall).toEqual(params);

    errorSpy.mockRestore();
    clientSpy.mockRestore();
  });

  it('should dispatch its event to the source trigger instance', async () => {
    const anchor = h('a', { dataComponent: 'FrameAnchor' });
    const div = h('div', { id: 'frame' }, [anchor]);
    const frame = new Frame(div);
    await mount(frame);

    const frameAnchor = getInstanceFromElement(anchor, FrameAnchor);
    for (const event of Frame.config.emits) {
      const fn = vi.fn();
      frameAnchor.$on(event, (event: CustomEvent) => fn(...event.detail));
      frame.emitSync(event, frameAnchor, 'foo');
      expect(fn).toHaveBeenCalledWith('foo');
    }
  });
});
