import { describe, it, expect, vi, afterEach } from 'vitest';
import { Base } from '@studiometa/js-toolkit';
import { ClickOutside, Action } from '@studiometa/ui';
import { h, mount, destroy } from '#test-utils';

function click(target: EventTarget) {
  target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('The ClickOutside component', () => {
  it('should dispatch a `click-outside` event when clicking outside the element', async () => {
    const el = h('div');
    const outside = h('div');
    document.body.append(el, outside);
    const clickOutside = new ClickOutside(el);
    await mount(clickOutside);

    const handler = vi.fn();
    el.addEventListener('click-outside', handler);

    click(outside);
    expect(handler).toHaveBeenCalledTimes(1);

    await destroy(clickOutside);
  });

  it('should not dispatch when clicking the element or its children', async () => {
    const child = h('span');
    const el = h('div', [child]);
    document.body.append(el);
    const clickOutside = new ClickOutside(el);
    await mount(clickOutside);

    const handler = vi.fn();
    el.addEventListener('click-outside', handler);

    click(el);
    click(child);
    expect(handler).not.toHaveBeenCalled();

    await destroy(clickOutside);
  });

  it('should forward the original event in the `detail`', async () => {
    const el = h('div');
    const outside = h('div');
    document.body.append(el, outside);
    const clickOutside = new ClickOutside(el);
    await mount(clickOutside);

    let detail: any;
    el.addEventListener('click-outside', (event: CustomEvent) => {
      detail = event.detail;
    });

    click(outside);
    expect(detail.event).toBeInstanceOf(MouseEvent);

    await destroy(clickOutside);
  });

  it('should trigger an `Action` effect via `data-on:click-outside`', async () => {
    const fn = vi.fn();
    class Foo extends Base {
      static config = {
        name: 'Foo',
      };

      fn() {
        fn();
      }
    }

    const el = h('div', {
      dataComponent: 'ClickOutside Action',
      'data-on:click-outside': 'Foo->target.fn()',
    });
    const fooEl = h('div', { class: 'foo', dataComponent: 'Foo' });
    const outside = h('div');
    document.body.append(el, fooEl, outside);

    const clickOutside = new ClickOutside(el);
    const action = new Action(el);
    const foo = new Foo(fooEl);
    await mount(clickOutside, action, foo);

    click(outside);
    expect(fn).toHaveBeenCalledTimes(1);

    click(el);
    expect(fn).toHaveBeenCalledTimes(1);

    await destroy(clickOutside, action, foo);
  });

  it('should stop dispatching once destroyed', async () => {
    const el = h('div');
    const outside = h('div');
    document.body.append(el, outside);
    const clickOutside = new ClickOutside(el);
    await mount(clickOutside);

    const handler = vi.fn();
    el.addEventListener('click-outside', handler);

    await destroy(clickOutside);

    click(outside);
    expect(handler).not.toHaveBeenCalled();
  });
});
