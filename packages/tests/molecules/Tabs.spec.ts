import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Tabs } from '@studiometa/ui';
import { wait } from '#test-utils';
import template from './Tabs.template.html';

describe('The Tabs component', () => {
  let tabs;

  beforeEach(async () => {
    document.body.innerHTML = template;
    jest.useFakeTimers();
    tabs = new Tabs(document.body.firstElementChild).$mount();
    await jest.advanceTimersByTimeAsync(100);
    jest.useRealTimers();
  });

  it('should emit `enable` and `disable` events.', async () => {
    const enableFn = jest.fn();
    const disableFn = jest.fn();
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

  it('should update aria-attributes when opening and closing.', () => {
    tabs.$refs.btn[0].click();
    expect(tabs.$refs.content[1].getAttribute('aria-hidden')).toBe('true');
    tabs.$refs.btn[1].click();
    expect(tabs.$refs.content[1].getAttribute('aria-hidden')).toBe('false');
  });

  it('should not be working when destroyed.', async () => {
    const fn = jest.fn();
    tabs.$on('enable', fn);
    tabs.$refs.btn[1].click();
    expect(fn).toHaveBeenCalledTimes(1);
    jest.useFakeTimers();
    tabs.$destroy();
    await jest.advanceTimersByTimeAsync(100);
    jest.useRealTimers();
    tabs.$refs.btn[0].click();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should add and remove classes and/or styles', async () => {
    await tabs.enableItem(tabs.items[1]);
    await tabs.disableItem(tabs.items[0]);
    expect(tabs.$refs.btn[1].getAttribute('style')).toBe('border-bottom-color: #fff;');
    expect(tabs.$refs.content[1].getAttribute('style')).toBe('');
    await tabs.enableItem(tabs.items[2]);
    await tabs.disableItem(tabs.items[1]);
    expect(tabs.$refs.btn[1].getAttribute('style')).toBe('');
    expect(tabs.$refs.content[1].getAttribute('style')).toBe(
      'position: absolute; opacity: 0; pointer-events: none; visibility: hidden;'
    );
  });

  it('should work without styles definition', async () => {
    tabs.$options.styles = { btn: false, content: false };
    tabs.$refs.btn[1].setAttribute('style', '');
    tabs.$refs.content[1].setAttribute('style', '');
    await tabs.enableItem(tabs.items[1]);
    expect(tabs.$refs.btn[1].getAttribute('style')).toBe('');
    expect(tabs.$refs.content[1].getAttribute('style')).toBe('');
    await tabs.enableItem(tabs.items[2]);
    await tabs.disableItem(tabs.items[1]);
    expect(tabs.$refs.btn[1].getAttribute('style')).toBe('');
    expect(tabs.$refs.content[1].getAttribute('style')).toBe('');
  });
});
