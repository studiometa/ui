import { describe, it, expect, vi, afterEach } from 'vitest';
import { Toast } from '@studiometa/ui';
import { h, mount, wait } from '#test-utils';

/**
 * Build a Toast element with a `[data-ref=close]` control and mount a `Toast`
 * on it. `delay` is in seconds (Timer's option); `autostart` follows Timer's
 * default of `true` unless disabled.
 */
async function createToast({ delay, autostart = true } = {} as {
  delay?: number;
  autostart?: boolean;
}) {
  const el = h('div', {
    dataComponent: 'Toast',
    class: 'toast',
    ...(delay === undefined ? {} : { dataOptionDelay: String(delay) }),
    ...(autostart ? {} : { 'data-option-no-autostart': '' }),
  }) as HTMLElement;
  el.innerHTML = '<p data-message>Message</p><button type="button" data-ref="close"></button>';
  document.body.append(el);
  const toast = new Toast(el);
  await mount(toast);
  return { toast, el };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('The Toast component', () => {
  it('should auto-dismiss after its delay and emit `dismiss`', async () => {
    const { toast, el } = await createToast({ delay: 0.02 });
    const dismissFn = vi.fn();
    toast.$on('dismiss', dismissFn);
    expect(el.isConnected).toBe(true);
    await wait(80);
    expect(el.isConnected).toBe(false);
    expect(dismissFn).toHaveBeenCalledTimes(1);
    expect(dismissFn.mock.calls[0][0].detail).toEqual([el]);
  });

  it('should dismiss when the close ref is clicked', async () => {
    const { el } = await createToast({ autostart: false });
    (el.querySelector('[data-ref=close]') as HTMLElement).click();
    await wait(20);
    expect(el.isConnected).toBe(false);
  });

  it('should pause the countdown while hovered and resume on leave', async () => {
    const { el } = await createToast({ delay: 0.02 });
    el.dispatchEvent(new Event('mouseenter'));
    await wait(80);
    expect(el.isConnected).toBe(true);
    el.dispatchEvent(new Event('mouseleave'));
    await wait(80);
    expect(el.isConnected).toBe(false);
  });

  it('should pause the countdown while focus is inside and resume on blur', async () => {
    const { el } = await createToast({ delay: 0.02 });
    el.dispatchEvent(new Event('focusin'));
    await wait(80);
    expect(el.isConnected).toBe(true);
    el.dispatchEvent(new Event('focusout'));
    await wait(80);
    expect(el.isConnected).toBe(false);
  });

  it('should stay put when autostart is disabled (sticky)', async () => {
    const { el } = await createToast({ delay: 0.02, autostart: false });
    await wait(80);
    expect(el.isConnected).toBe(true);
    (el.querySelector('[data-ref=close]') as HTMLElement).click();
    await wait(20);
    expect(el.isConnected).toBe(false);
  });

  it('should be idempotent to dismiss twice', async () => {
    const { toast, el } = await createToast({ autostart: false });
    const dismissFn = vi.fn();
    toast.$on('dismiss', dismissFn);
    toast.dismiss();
    toast.dismiss();
    await wait(20);
    expect(dismissFn).toHaveBeenCalledTimes(1);
    expect(el.isConnected).toBe(false);
  });

  it('should cancel the countdown on destroy (no dismiss after teardown)', async () => {
    const { toast, el } = await createToast({ delay: 0.02 });
    const dismissFn = vi.fn();
    toast.$on('dismiss', dismissFn);
    await toast.$destroy();
    await wait(80);
    expect(dismissFn).not.toHaveBeenCalled();
    expect(el.isConnected).toBe(true);
  });
});
