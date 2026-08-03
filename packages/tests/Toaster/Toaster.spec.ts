import { describe, it, expect, vi, afterEach } from 'vitest';
import { Toaster } from '@studiometa/ui';
import { h, mount, wait } from '#test-utils';

/**
 * Install a fake `document.startViewTransition` that runs the update callback
 * and resolves its promises, recording every call. Returns the call list.
 */
function mockStartViewTransition() {
  const calls: Array<() => void | Promise<void>> = [];
  // @ts-expect-error — happy-dom does not implement the View Transitions API.
  document.startViewTransition = (update: () => void | Promise<void>) => {
    calls.push(update);
    const done = Promise.resolve().then(() => update());
    return { finished: done, ready: done, updateCallbackDone: done };
  };
  return calls;
}

/**
 * Build a Toaster with its two live regions and a toast template. The template
 * markup is set through `innerHTML` so the `<template>` populates its `content`
 * fragment, from which the component clones each toast.
 */
async function createToaster({ duration, assertive = true } = {} as {
  duration?: number;
  assertive?: boolean;
}) {
  const el = h('div', {
    dataComponent: 'Toaster',
    ...(duration === undefined ? {} : { dataOptionDuration: String(duration) }),
  });
  el.innerHTML = `
    <div data-ref="polite" aria-live="polite"></div>
    ${assertive ? '<div data-ref="assertive" aria-live="assertive"></div>' : ''}
    <template data-ref="template">
      <div class="toast"><p data-message></p><button type="button" data-close></button></div>
    </template>
  `;
  document.body.append(el);
  const toaster = new Toaster(el);
  await mount(toaster);
  return { toaster, el };
}

afterEach(() => {
  document.body.innerHTML = '';
  // @ts-expect-error — reset the API mock between tests.
  delete document.startViewTransition;
});

describe('The Toaster component', () => {
  it('should start with no toast', async () => {
    const { el } = await createToaster();
    expect(el.querySelectorAll('.toast')).toHaveLength(0);
  });

  it('should append a toast holding the message to the polite region', async () => {
    const { toaster } = await createToaster();
    toaster.show('Saved.');
    await wait(0);
    const polite = toaster.$refs.polite;
    expect(polite.querySelectorAll('.toast')).toHaveLength(1);
    expect(polite.querySelector('[data-message]')?.textContent).toBe('Saved.');
  });

  it('should route error toasts to the assertive region', async () => {
    const { toaster } = await createToaster();
    toaster.show('Boom.', { type: 'error' });
    await wait(0);
    expect(toaster.$refs.assertive.querySelectorAll('.toast')).toHaveLength(1);
    expect(toaster.$refs.polite.querySelectorAll('.toast')).toHaveLength(0);
  });

  it('should fall back to the polite region when there is no assertive one', async () => {
    const { toaster } = await createToaster({ assertive: false });
    toaster.show('Boom.', { type: 'error' });
    await wait(0);
    expect(toaster.$refs.polite.querySelectorAll('.toast')).toHaveLength(1);
  });

  it('should mirror the type on the toast and assign a unique view-transition-name', async () => {
    const { toaster } = await createToaster();
    const a = toaster.show('a', { type: 'success' });
    const b = toaster.show('b');
    expect(a.dataset.type).toBe('success');
    expect(b.dataset.type).toBe('info');
    const nameA = a.style.getPropertyValue('view-transition-name');
    const nameB = b.style.getPropertyValue('view-transition-name');
    expect(nameA).toMatch(/^toaster-\d+$/);
    expect(nameB).toMatch(/^toaster-\d+$/);
    expect(nameA).not.toBe(nameB);
  });

  it('should remove a toast on dismiss()', async () => {
    const { toaster } = await createToaster({ duration: 0 });
    const toast = toaster.show('Saved.');
    await wait(0);
    expect(toast.isConnected).toBe(true);
    toaster.dismiss(toast);
    await wait(0);
    expect(toast.isConnected).toBe(false);
  });

  it('should dismiss a toast when its close button is clicked', async () => {
    const { toaster } = await createToaster({ duration: 0 });
    const toast = toaster.show('Saved.');
    await wait(0);
    (toast.querySelector('[data-close]') as HTMLElement).click();
    await wait(0);
    expect(toast.isConnected).toBe(false);
  });

  it('should be a no-op to dismiss an already-removed toast', async () => {
    const { toaster } = await createToaster({ duration: 0 });
    const dismissFn = vi.fn();
    toaster.$on('dismiss', dismissFn);
    const toast = toaster.show('Saved.');
    await wait(0);
    toaster.dismiss(toast);
    await wait(0);
    toaster.dismiss(toast);
    expect(dismissFn).toHaveBeenCalledTimes(1);
  });

  it('should auto-dismiss after the duration', async () => {
    const { toaster } = await createToaster({ duration: 0.02 });
    const toast = toaster.show('Saved.');
    await wait(0);
    expect(toast.isConnected).toBe(true);
    await wait(60);
    expect(toast.isConnected).toBe(false);
  });

  it('should keep a toast with duration 0 sticky', async () => {
    const { toaster } = await createToaster({ duration: 0 });
    const toast = toaster.show('Saved.');
    await wait(60);
    expect(toast.isConnected).toBe(true);
  });

  it('should pause the auto-dismiss timer while hovered and resume on leave', async () => {
    const { toaster } = await createToaster({ duration: 0.02 });
    const toast = toaster.show('Saved.');
    // Pause synchronously, before the timer can ever fire.
    toast.dispatchEvent(new Event('mouseenter'));
    await wait(60);
    expect(toast.isConnected).toBe(true);
    toast.dispatchEvent(new Event('mouseleave'));
    await wait(60);
    expect(toast.isConnected).toBe(false);
  });

  it('should emit `show` and `dismiss` events', async () => {
    const { toaster } = await createToaster({ duration: 0 });
    const showFn = vi.fn();
    const dismissFn = vi.fn();
    toaster.$on('show', showFn);
    toaster.$on('dismiss', dismissFn);

    const toast = toaster.show('Saved.', { type: 'error' });
    // js-toolkit delivers the emitted args as the event's `detail` array.
    expect(showFn).toHaveBeenCalledTimes(1);
    expect(showFn.mock.calls[0][0].detail).toEqual([toast, 'Saved.', 'error']);
    await wait(0);

    toaster.dismiss(toast);
    expect(dismissFn).toHaveBeenCalledTimes(1);
    expect(dismissFn.mock.calls[0][0].detail).toEqual([toast]);
  });

  it('should batch toasts fired in the same tick into a single view transition', async () => {
    const calls = mockStartViewTransition();
    const { toaster } = await createToaster({ duration: 0 });

    toaster.show('one');
    toaster.show('two');
    toaster.show('three');
    await wait(0);

    expect(calls).toHaveLength(1);
    expect(toaster.$refs.polite.querySelectorAll('.toast')).toHaveLength(3);
  });

  it('should clear pending timers on destroy', async () => {
    const { toaster } = await createToaster({ duration: 0.02 });
    const toast = toaster.show('Saved.');
    await wait(0);
    await toaster.$destroy();
    await wait(60);
    // The toast is still connected: its auto-dismiss timer was cleared, so it
    // never fired after teardown.
    expect(toast.isConnected).toBe(true);
  });
});
