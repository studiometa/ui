import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Tabs } from '@studiometa/ui';
import { wait, h } from '#test-utils';
import template from './Tabs.template.html.js';

async function getContext() {
  const tmp = h('div');
  tmp.innerHTML = template;
  const root = tmp.firstElementChild as HTMLElement;
  const tabs = new Tabs(root);
  await tabs.$mount();
  return {
    root,
    tabs,
  };
}

describe('The Tabs component', () => {
  it('should emit `enable` and `disable` events.', async () => {
    const { tabs } = await getContext();
    const enableFn = vi.fn();
    const disableFn = vi.fn();
    tabs.$on('enable', enableFn);
    tabs.$on('disable', disableFn);

    tabs.$refs.btn[1].click();
    expect(enableFn).toHaveBeenCalledTimes(1);
    expect(disableFn).toHaveBeenCalledTimes(1);

    tabs.$refs.btn[0].click();
    expect(enableFn).toHaveBeenCalledTimes(2);
    expect(enableFn.mock.calls[1][0].detail[0]).toEqual({
      btn: tabs.$refs.btn[0],
      content: tabs.$refs.content[0],
      isEnabled: true,
    });
    expect(disableFn).toHaveBeenCalledTimes(2);
    expect(disableFn.mock.calls[1][0].detail[0]).toEqual({
      btn: tabs.$refs.btn[1],
      content: tabs.$refs.content[1],
      isEnabled: false,
    });
    tabs.$off('enable');
    tabs.$off('disable');
  });

  it('should update aria-attributes when opening and closing.', async () => {
    const { tabs } = await getContext();
    tabs.$refs.btn[0].click();
    expect(tabs.$refs.content[1].getAttribute('aria-hidden')).toBe('true');
    tabs.$refs.btn[1].click();
    expect(tabs.$refs.content[1].getAttribute('aria-hidden')).toBe('false');
  });

  it('should not be working when destroyed.', async () => {
    const { tabs } = await getContext();
    const fn = vi.fn();
    tabs.$on('enable', fn);
    tabs.$refs.btn[1].click();
    expect(fn).toHaveBeenCalledTimes(1);
    await tabs.$destroy();
    tabs.$refs.btn[0].click();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should add and remove classes and/or styles', async () => {
    const { tabs } = await getContext();

    await tabs.enableItem(tabs.items[1]);
    await tabs.disableItem(tabs.items[0]);
    expect(tabs.$refs.btn[1].getAttribute('style')).toBe('border-bottom-color: #fff;');
    expect(tabs.$refs.content[1].getAttribute('style')).toBe(null);
    await tabs.enableItem(tabs.items[2]);
    await tabs.disableItem(tabs.items[1]);
    expect(tabs.$refs.btn[1].getAttribute('style')).toBe(null);
    expect(tabs.$refs.content[1].getAttribute('style')).toBe(
      'position: absolute; opacity: 0; pointer-events: none; visibility: hidden;',
    );
  });

  it.skip('should work without styles definition', async () => {
    const { tabs } = await getContext();
    tabs.$options.styles = { btn: {}, content: {} };
    tabs.$refs.btn[1].setAttribute('style', '');
    tabs.$refs.content[1].setAttribute('style', '');
    await tabs.enableItem(tabs.items[1]);
    expect(tabs.$refs.btn[1].getAttribute('style')).toBe(null);
    expect(tabs.$refs.content[1].getAttribute('style')).toMatchInlineSnapshot(`"position: absolute; opacity: 0; pointer-events: none; visibility: hidden;"`);
    await tabs.enableItem(tabs.items[2]);
    await tabs.disableItem(tabs.items[1]);
    expect(tabs.$refs.btn[1].getAttribute('style')).toBe(null);
    expect(tabs.$refs.content[1].getAttribute('style')).toBe(null);
  });
});
