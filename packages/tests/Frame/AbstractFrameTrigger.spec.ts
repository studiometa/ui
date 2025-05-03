import { describe, it, expect, vi } from 'vitest';
import { AbstractFrameTrigger } from '@studiometa/ui';
import { h } from '#test-utils';

describe('The AbstractFrameTrigger class', () => {
  it('should have an `url` getter', async () => {
    const triggerA = new AbstractFrameTrigger(h('a', { href: 'https://localhost/foo' }));
    expect(triggerA.url.toString()).toBe('https://localhost/foo');
    const triggerB = new AbstractFrameTrigger(h('form', { action: 'https://localhost/foo' }));
    expect(triggerB.url.toString()).toBe('https://localhost/foo');
  });

  it('should emit a `frame-trigger` event when triggered', () => {
    const trigger = new AbstractFrameTrigger(h('a', { href: 'http://localhost' }));
    const fn = vi.fn();
    trigger.$on('frame-trigger', (event: CustomEvent) => fn(...event.detail));
    trigger.trigger();
    expect(fn).toHaveBeenCalledOnce();
    expect(fn.mock.lastCall).toMatchInlineSnapshot(`
      [
        "http://localhost/",
        {
          "headers": {},
        },
      ]
    `);
  });

  it('should have a `requestInit` option', () => {
    const dataOptionRequestInit = { method: 'POST' };
    const trigger = new AbstractFrameTrigger(
      h('a', { href: 'http://localhost', dataOptionRequestInit }),
    );
    expect(trigger.requestInit.method).toEqual(dataOptionRequestInit.method);
  });

  it('should have a `headers` option', () => {
    const dataOptionHeaders = { Accept: 'text/*' };
    const trigger = new AbstractFrameTrigger(
      h('a', { href: 'http://localhost', dataOptionHeaders }),
    );
    expect(trigger.requestInit.headers).toEqual(dataOptionHeaders);
  });
});
