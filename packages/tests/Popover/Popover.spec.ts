import { describe, it, expect, vi, afterEach } from 'vitest';
import { Popover } from '@studiometa/ui';
import { h, mount } from '#test-utils';

/**
 * happy-dom does not implement `HTMLElement.showPopover()`/`hidePopover()`, so
 * we stub them as spies. The component tracks its own open state, so the stubs
 * need no behavior of their own.
 */
function mockPopover(el: HTMLElement) {
  el.showPopover = vi.fn();
  el.hidePopover = vi.fn();
  return el;
}

function transitionChild() {
  return h('div', {
    dataComponent: 'Transition',
    dataOptionEnterFrom: 'opacity-0',
    dataOptionLeaveTo: 'opacity-0',
    dataOptionLeaveKeep: '',
    class: 'opacity-0',
  });
}

async function createPopover({ children = 0 } = {}) {
  const kids = Array.from({ length: children }, transitionChild);
  const el = h('div', { dataComponent: 'Popover', popover: 'auto' }, kids);
  mockPopover(el);
  document.body.append(el);
  const popover = new Popover(el);
  await mount(popover);
  return { popover, el };
}

/**
 * Dispatch the native `toggle` event the platform fires on light-dismiss.
 */
function nativeToggle(el: HTMLElement, newState: 'open' | 'closed') {
  const event = new Event('toggle');
  Object.assign(event, { newState });
  el.dispatchEvent(event);
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('The Popover component', () => {
  it('should be closed on instantiation', async () => {
    const { popover, el } = await createPopover();
    expect(popover.__isOpen).toBe(false);
    expect(el.showPopover).not.toHaveBeenCalled();
  });

  it('should show the popover on open', async () => {
    const { popover, el } = await createPopover();
    await popover.open();
    expect(el.showPopover).toHaveBeenCalledTimes(1);
    expect(popover.__isOpen).toBe(true);
  });

  it('should hide the popover on close', async () => {
    const { popover, el } = await createPopover();
    await popover.open();
    await popover.close();
    expect(el.hidePopover).toHaveBeenCalledTimes(1);
    expect(popover.__isOpen).toBe(false);
  });

  it('should be a no-op to open an already open popover', async () => {
    const { popover, el } = await createPopover();
    await popover.open();
    await popover.open();
    expect(el.showPopover).toHaveBeenCalledTimes(1);
  });

  it('should be a no-op to close an already closed popover', async () => {
    const { popover, el } = await createPopover();
    await popover.close();
    expect(el.hidePopover).not.toHaveBeenCalled();
  });

  it('should toggle between open and close', async () => {
    const { popover, el } = await createPopover();
    await popover.toggle();
    expect(el.showPopover).toHaveBeenCalledTimes(1);
    expect(popover.__isOpen).toBe(true);
    await popover.toggle();
    expect(el.hidePopover).toHaveBeenCalledTimes(1);
    expect(popover.__isOpen).toBe(false);
  });

  it('should emit `open` and `close` events', async () => {
    const { popover } = await createPopover();
    const openFn = vi.fn();
    const closeFn = vi.fn();
    popover.$on('open', openFn);
    popover.$on('close', closeFn);

    await popover.open();
    expect(openFn).toHaveBeenCalledTimes(1);
    await popover.close();
    expect(closeFn).toHaveBeenCalledTimes(1);
  });

  it('should fan `enter()`/`leave()` out to every transition child', async () => {
    const { popover } = await createPopover({ children: 2 });
    expect(popover.transitions).toHaveLength(2);

    const enters = popover.transitions.map((transition) =>
      vi.spyOn(transition, 'enter').mockResolvedValue(),
    );
    const leaves = popover.transitions.map((transition) =>
      vi.spyOn(transition, 'leave').mockResolvedValue(),
    );

    await popover.open();
    for (const enter of enters) expect(enter).toHaveBeenCalledTimes(1);
    for (const leave of leaves) expect(leave).not.toHaveBeenCalled();

    await popover.close();
    for (const leave of leaves) expect(leave).toHaveBeenCalledTimes(1);
  });

  it('should leave transitions BEFORE hiding the popover', async () => {
    const { popover, el } = await createPopover({ children: 1 });
    const [transition] = popover.transitions;
    const order: string[] = [];
    vi.spyOn(transition, 'leave').mockImplementation(async () => {
      order.push('leave');
    });
    (el.hidePopover as ReturnType<typeof vi.fn>).mockImplementation(() => {
      order.push('hide');
    });

    await popover.open();
    await popover.close();
    expect(order).toEqual(['leave', 'hide']);
  });

  it('should sync state and emit `close` on a platform light-dismiss', async () => {
    const { popover, el } = await createPopover();
    const closeFn = vi.fn();
    popover.$on('close', closeFn);

    await popover.open();
    // The platform closes it (Esc / outside click) without calling `close()`.
    nativeToggle(el, 'closed');
    expect(popover.__isOpen).toBe(false);
    expect(closeFn).toHaveBeenCalledTimes(1);

    // It can be reopened afterwards.
    await popover.open();
    expect(el.showPopover).toHaveBeenCalledTimes(2);
  });
});
