import { describe, it, expect, vi, afterEach } from 'vitest';
import { Dialog } from '@studiometa/ui';
import { h, mount } from '#test-utils';

/**
 * happy-dom does not implement `HTMLDialogElement.showModal()`/`show()`/
 * `close()` nor a reactive `open` property, so we stub them: `showModal()` and
 * `show()` flip `open` to `true`, `close()` back to `false`.
 */
function mockDialog(el: HTMLDialogElement) {
  let isOpen = false;
  Object.defineProperty(el, 'open', {
    configurable: true,
    get: () => isOpen,
    set: (value: boolean) => {
      isOpen = value;
    },
  });
  el.showModal = vi.fn(() => {
    isOpen = true;
  });
  el.show = vi.fn(() => {
    isOpen = true;
  });
  el.close = vi.fn(() => {
    isOpen = false;
  });
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

async function createDialog({ children = 0 } = {}) {
  const kids = Array.from({ length: children }, transitionChild);
  const el = h('dialog', { dataComponent: 'Dialog' }, kids) as HTMLDialogElement;
  mockDialog(el);
  document.body.append(el);
  const dialog = new Dialog(el);
  await mount(dialog);
  return { dialog, el };
}

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.style.overflow = '';
});

describe('The Dialog component', () => {
  it('should be closed on instantiation', async () => {
    const { dialog } = await createDialog();
    expect(dialog.dialog.open).toBe(false);
  });

  it('should open with `showModal()` on the modal path', async () => {
    const { dialog, el } = await createDialog();
    await dialog.open();
    expect(el.showModal).toHaveBeenCalledTimes(1);
    expect(el.show).not.toHaveBeenCalled();
    expect(dialog.dialog.open).toBe(true);
  });

  it('should open with `show()` on the non-modal path', async () => {
    const { dialog, el } = await createDialog();
    dialog.$options.modal = false;
    await dialog.open();
    expect(el.show).toHaveBeenCalledTimes(1);
    expect(el.showModal).not.toHaveBeenCalled();
  });

  it('should close the native dialog', async () => {
    const { dialog, el } = await createDialog();
    await dialog.open();
    await dialog.close();
    expect(el.close).toHaveBeenCalledTimes(1);
    expect(dialog.dialog.open).toBe(false);
  });

  it('should be a no-op to open an already open dialog', async () => {
    const { dialog, el } = await createDialog();
    await dialog.open();
    await dialog.open();
    expect(el.showModal).toHaveBeenCalledTimes(1);
  });

  it('should be a no-op to close an already closed dialog', async () => {
    const { dialog, el } = await createDialog();
    await dialog.close();
    expect(el.close).not.toHaveBeenCalled();
  });

  it('should toggle between open and close', async () => {
    const { dialog, el } = await createDialog();
    await dialog.toggle();
    expect(el.showModal).toHaveBeenCalledTimes(1);
    expect(dialog.dialog.open).toBe(true);
    await dialog.toggle();
    expect(el.close).toHaveBeenCalledTimes(1);
    expect(dialog.dialog.open).toBe(false);
  });

  it('should emit `open` and `close` events', async () => {
    const { dialog } = await createDialog();
    const openFn = vi.fn();
    const closeFn = vi.fn();
    dialog.$on('open', openFn);
    dialog.$on('close', closeFn);

    await dialog.open();
    expect(openFn).toHaveBeenCalledTimes(1);
    await dialog.close();
    expect(closeFn).toHaveBeenCalledTimes(1);
  });

  it('should lock and release the scroll when the option is on', async () => {
    const { dialog } = await createDialog();
    expect(document.documentElement.style.overflow).toBe('');
    await dialog.open();
    expect(document.documentElement.style.overflow).toBe('hidden');
    await dialog.close();
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('should not touch the scroll when the option is off', async () => {
    const { dialog } = await createDialog();
    dialog.$options.scrollLock = false;
    await dialog.open();
    expect(document.documentElement.style.overflow).toBe('');
    await dialog.close();
  });

  it('should fan `enter()`/`leave()` out to every transition child', async () => {
    const { dialog } = await createDialog({ children: 2 });
    expect(dialog.transitions).toHaveLength(2);

    const enters = dialog.transitions.map((transition) =>
      vi.spyOn(transition, 'enter').mockResolvedValue(),
    );
    const leaves = dialog.transitions.map((transition) =>
      vi.spyOn(transition, 'leave').mockResolvedValue(),
    );

    await dialog.open();
    for (const enter of enters) expect(enter).toHaveBeenCalledTimes(1);
    for (const leave of leaves) expect(leave).not.toHaveBeenCalled();

    await dialog.close();
    for (const leave of leaves) expect(leave).toHaveBeenCalledTimes(1);
  });

  it('should leave transitions BEFORE hiding the native dialog', async () => {
    const { dialog, el } = await createDialog({ children: 1 });
    const [transition] = dialog.transitions;
    const order: string[] = [];
    vi.spyOn(transition, 'leave').mockImplementation(async () => {
      order.push('leave');
    });
    (el.close as ReturnType<typeof vi.fn>).mockImplementation(() => {
      order.push('close');
      Object.defineProperty(el, 'open', { configurable: true, value: false });
    });

    await dialog.open();
    await dialog.close();
    expect(order).toEqual(['leave', 'close']);
  });
});
