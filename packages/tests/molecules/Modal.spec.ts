import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { nextFrame } from '@studiometa/js-toolkit/utils';
import { Modal } from '@studiometa/ui';
import { h } from '#test-utils';
import template from './Modal.template.html.js';

async function getContext({ move = '' } = {}) {
  const consoleSpy = vi.spyOn(console, 'warn');
  const target = h('div', { id: 'target' });
  const root = h('div');
  root.innerHTML = template;
  root.append(target);
  const modalRoot = root.firstElementChild;
  const modal = new Modal(root.firstElementChild as HTMLElement);
  if (move) {
    modal.$options.move = move;
  }

  vi.useFakeTimers();
  modal.$mount();
  await vi.advanceTimersByTimeAsync(100);
  vi.useRealTimers();

  return {
    root,
    modal,
    target,
    consoleSpy,
    consoleSpyRestor: () => consoleSpy.mockRestore(),
  };
}

describe('The Modal component', () => {
  it('should be closed on instantiation', async () => {
    const { modal, root } = await getContext();
    expect(modal.$el.outerHTML).toBe(root.firstElementChild.outerHTML);
    expect(modal.isOpen).toBe(false);
  });

  it('should emit events when opening and closing', async () => {
    const { modal } = await getContext();
    const fn = vi.fn();
    modal.$on('open', fn);
    modal.$on('close', fn);

    await modal.open();
    expect(fn).toHaveBeenCalledTimes(1);
    await modal.close();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should update aria-attributes when opening and closing.', async () => {
    const { modal } = await getContext();
    expect(modal.$refs.modal.getAttribute('aria-hidden')).toBe('true');
    await modal.open();
    expect(modal.$refs.modal.getAttribute('aria-hidden')).toBe('false');
    await modal.close();
  });

  it('should update refs classes and styles when opening and closing.', async () => {
    const { modal } = await getContext();
    await modal.open();
    await nextFrame();
    expect(modal.$refs.modal.getAttribute('style')).toBe(null);
    await modal.close();
    await nextFrame();
    expect(modal.$refs.modal.getAttribute('style')).toBe(
      'opacity: 0; pointer-events: none; visibility: hidden;',
    );
  });

  it('should set the focus to the `autofocus` element when opening.', async () => {
    const { modal } = await getContext();
    const autofocus = modal.$refs.modal.querySelector('[autofocus]');
    vi.spyOn(autofocus, 'focus');
    await modal.open();
    expect(autofocus.focus).toHaveBeenCalledTimes(1);
    await modal.close();
  });

  it.skip('should trap the focus when open.', async () => {
    const { modal } = await getContext();
    const tabKeydown = new KeyboardEvent('keydown', { keyCode: 9, bubbles: true });
    const closeButton = modal.$refs.modal.querySelector('[data-ref="close[]"]');
    const openButton = modal.$el.querySelector('[data-ref="open[]"]');
    openButton.focus();

    vi.spyOn(closeButton, 'focus');
    vi.spyOn(openButton, 'focus');

    await modal.open();
    document.dispatchEvent(tabKeydown);
    expect(closeButton.focus).toHaveBeenCalledTimes(1);
    expect(openButton.focus).toHaveBeenCalledTimes(0);
    document.dispatchEvent(tabKeydown);
    document.dispatchEvent(tabKeydown);
    expect(openButton.focus).toHaveBeenCalledTimes(0);
    expect(closeButton.focus).toHaveBeenCalledTimes(1);

    await modal.close();
    expect(openButton.focus).toHaveBeenCalledTimes(1);
  });

  it('should open when clicking the open button.', async () => {
    const { modal, root } = await getContext();
    const btn = root.querySelector('[data-ref="open[]"]');
    await modal.close();
    expect(modal.isOpen).toBe(false);
    btn.click();
    expect(modal.isOpen).toBe(true);
  });

  it('should close when pressing the escape key.', async () => {
    const { modal } = await getContext();
    const escapeKeyup = new KeyboardEvent('keyup', { keyCode: 27 });
    await modal.open();
    expect(modal.isOpen).toBe(true);
    document.dispatchEvent(escapeKeyup);
    expect(modal.isOpen).toBe(false);
    document.dispatchEvent(escapeKeyup);
    expect(modal.isOpen).toBe(false);
  });

  it('should close when clicking the overlay.', async () => {
    const { modal, root } = await getContext();
    const overlay = root.querySelector('[data-ref="overlay"]');
    await modal.open();
    expect(modal.isOpen).toBe(true);
    overlay.click();
    expect(modal.isOpen).toBe(false);
  });

  it('should close when clicking the close button.', async () => {
    const { modal, root } = await getContext();
    const btn = root.querySelector('[data-ref="close[]"]');

    await modal.open();
    expect(modal.isOpen).toBe(true);
    btn.click();
    expect(modal.isOpen).toBe(false);
  });

  it('should close on destroy.', async () => {
    const { modal } = await getContext();
    await modal.open();
    expect(modal.isOpen).toBe(true);
    vi.useFakeTimers();
    modal.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();
    expect(modal.isOpen).toBe(false);
  });
});

describe('The Modal component with the `move` option', () => {
  it('should move the `modal` ref to the `#target` element on mounted.', async () => {
    const { modal } = await getContext({ move: '#target' });
    expect(document.body.firstElementChild).toBe(modal.$refs.modal);
  });

  it.skip('should move the `modal` ref back to its previous place.', async () => {
    const { modal } = await getContext({ move: '#target' });
    vi.useFakeTimers();
    modal.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();
    expect(document.body.firstElementChild).toBeNull();
  });
});
