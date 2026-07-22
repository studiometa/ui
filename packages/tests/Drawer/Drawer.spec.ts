import { describe, it, expect, vi, afterEach } from 'vitest';
import { Drawer } from '@studiometa/ui';
import { h, mount } from '#test-utils';

/**
 * happy-dom does not implement the `<dialog>` methods, so we stub them the same
 * way the Dialog spec does.
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

function backdrop() {
  return h('div', {
    dataComponent: 'Transition',
    dataOptionLeaveTo: 'opacity-0',
    dataOptionLeaveKeep: '',
    class: 'opacity-0',
  });
}

function panel() {
  return h('div', {
    dataComponent: 'Transition',
    dataDrawerPanel: '',
    dataOptionEnterFrom: '',
    dataOptionLeaveTo: '',
    dataOptionLeaveKeep: '',
    class: 'w-80',
  });
}

async function createDrawer({ position = '' } = {}) {
  const attrs: Record<string, string> = { dataComponent: 'Drawer' };
  if (position) {
    attrs.dataOptionPosition = position;
  }
  const el = h('dialog', attrs, [backdrop(), panel()]) as HTMLDialogElement;
  mockDialog(el);
  document.body.append(el);
  const drawer = new Drawer(el);
  await mount(drawer);
  return { drawer, el };
}

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.style.overflow = '';
});

describe('The Drawer component', () => {
  it('should default to the right position', async () => {
    const { drawer } = await createDrawer();
    expect(drawer.$options.position).toBe('right');
    expect(drawer.slideClass).toBe('translate-x-full');
  });

  it('should map every position to its slide class', async () => {
    const cases: Array<[string, string]> = [
      ['top', '-translate-y-full'],
      ['right', 'translate-x-full'],
      ['bottom', 'translate-y-full'],
      ['left', '-translate-x-full'],
    ];
    for (const [position, expected] of cases) {
      // eslint-disable-next-line no-await-in-loop
      const { drawer } = await createDrawer({ position });
      expect(drawer.slideClass).toBe(expected);
    }
  });

  it('should only treat `data-drawer-panel` children as panels', async () => {
    const { drawer } = await createDrawer();
    expect(drawer.transitions).toHaveLength(2);
    expect(drawer.panels).toHaveLength(1);
    expect(drawer.panels[0].$el.hasAttribute('data-drawer-panel')).toBe(true);
  });

  it('should feed the slide class to the panel initial class and options', async () => {
    const { drawer } = await createDrawer({ position: 'left' });
    const [panelChild] = drawer.panels;

    expect(panelChild.$el.classList.contains('-translate-x-full')).toBe(true);
    expect(panelChild.$options.leaveTo).toContain('-translate-x-full');
    expect(panelChild.$options.enterFrom).toContain('-translate-x-full');
  });

  it('should leave the backdrop child untouched', async () => {
    const { drawer } = await createDrawer();
    const backdropChild = drawer.transitions.find(
      (transition) => !transition.$el.hasAttribute('data-drawer-panel'),
    );
    expect(backdropChild?.$el.classList.contains('translate-x-full')).toBe(false);
    expect(backdropChild?.$options.leaveTo).toBe('opacity-0');
  });

  it('should inherit the Dialog open/close behavior', async () => {
    const { drawer, el } = await createDrawer();
    for (const transition of drawer.transitions) {
      vi.spyOn(transition, 'enter').mockResolvedValue();
      vi.spyOn(transition, 'leave').mockResolvedValue();
    }

    await drawer.open();
    expect(el.showModal).toHaveBeenCalledTimes(1);
    expect(document.documentElement.style.overflow).toBe('hidden');

    await drawer.close();
    expect(el.close).toHaveBeenCalledTimes(1);
    expect(document.documentElement.style.overflow).toBe('');
  });
});
