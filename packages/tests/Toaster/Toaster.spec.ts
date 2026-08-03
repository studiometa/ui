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
 * Build a Toaster with its two live regions and a `Toast` template. `Toast` is
 * intentionally not registered here, so appended toasts stay inert markup and
 * these tests assert the DOM the factory produces (Toast's own behaviour lives
 * in Toast.spec.ts).
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
      <div class="toast"><p data-message></p><button type="button" data-ref="close"></button></div>
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

  it('should append a Toast holding the message to the polite region', async () => {
    const { toaster } = await createToaster();
    toaster.show('Saved.');
    await wait(0);
    const polite = toaster.$refs.polite;
    const toast = polite.querySelector('.toast');
    expect(toast?.getAttribute('data-component')).toBe('Toast');
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

  it('should mirror the type and assign a unique view-transition-name', async () => {
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

  it('should write the duration onto the toast as the Timer `delay`', async () => {
    const { toaster } = await createToaster({ duration: 5 });
    const a = toaster.show('a');
    expect(a.dataset.optionDelay).toBe('5');
    const b = toaster.show('b', { duration: 8 });
    expect(b.dataset.optionDelay).toBe('8');
  });

  it('should make a 0-duration toast sticky by disabling its autostart', async () => {
    const { toaster } = await createToaster({ duration: 0 });
    const toast = toaster.show('Saved.');
    expect(toast.hasAttribute('data-option-no-autostart')).toBe(true);
    expect(toast.dataset.optionDelay).toBeUndefined();
  });

  it('should emit a `show` event with the toast, message and type', async () => {
    const { toaster } = await createToaster();
    const showFn = vi.fn();
    toaster.$on('show', showFn);
    const toast = toaster.show('Saved.', { type: 'error' });
    expect(showFn).toHaveBeenCalledTimes(1);
    expect(showFn.mock.calls[0][0].detail).toEqual([toast, 'Saved.', 'error']);
  });

  it('should batch toasts fired in the same tick into a single view transition', async () => {
    const calls = mockStartViewTransition();
    const { toaster } = await createToaster();

    toaster.show('one');
    toaster.show('two');
    toaster.show('three');
    await wait(0);

    expect(calls).toHaveLength(1);
    expect(toaster.$refs.polite.querySelectorAll('.toast')).toHaveLength(3);
  });
});
