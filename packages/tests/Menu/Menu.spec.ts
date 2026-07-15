import { describe, it, expect, vi } from 'vitest';
import { getInstanceFromElement } from '@studiometa/js-toolkit';
import { Menu, MenuBtn, MenuList } from '@studiometa/ui';
import { h, mount, wait } from '#test-utils';

async function getContext({ mode = 'click' } = {}) {
  const menuBtn = h('button', { dataComponent: 'MenuBtn' }, ['Click me']);
  const menuList = h('div', { dataComponent: 'MenuList' });
  const root = h('div', { dataOptionMode: mode }, [menuBtn, menuList]);
  const menu = new Menu(root);
  await mount(menu);
  return {
    menuBtn,
    menuList,
    root,
    menu,
  };
}

describe('The Menu component', () => {
  it('should not mount if no menuList or menuBtn child', async () => {
    const menu = new Menu(h('div'));
    await mount(menu);
    expect(menu.menuList).toBeUndefined();
    expect(menu.menuBtn).toBeUndefined();
    expect(menu.$isMounted).toBe(false);
  });

  it('should have a shouldReactOnClick getter based on its mode option', async () => {
    const menu = new Menu(h('div'));
    await mount(menu);
    expect(menu.$options.mode).toBe('click');
    expect(menu.shouldReactOnClick).toBe(true);
    menu.$el.dataset.optionMode = 'hover';
    expect(menu.$options.mode).toBe('hover');
    expect(menu.shouldReactOnClick).toBe(false);
  });

  it('should add aria-attributes to its menu list and menu btn', async () => {
    const { menu, menuBtn, menuList } = await getContext();
    expect(menu.menuBtn).toBeInstanceOf(MenuBtn);
    expect(menu.menuList).toBeInstanceOf(MenuList);

    expect(menuBtn.getAttribute('aria-controls')).toBe(menu.$id);
    expect(menuList.id).toBe(menu.$id);
  });

  it('should delegate the open, close and toggle methods to menuList', async () => {
    const { menu } = await getContext();
    const openSpy = vi.spyOn(menu.menuList, 'open');
    const closeSpy = vi.spyOn(menu.menuList, 'close');
    const toggleSpy = vi.spyOn(menu.menuList, 'toggle');
    menu.open();
    expect(openSpy).toHaveBeenCalledOnce();
    menu.close();
    expect(closeSpy).toHaveBeenCalledOnce();
    menu.toggle();
    expect(toggleSpy).toHaveBeenCalledOnce();
  });

  it('should close on escape', async () => {
    const { menu } = await getContext();
    const closeSpy = vi.spyOn(menu, 'close');
    // @ts-expect-error
    menu.keyed({ ENTER: false, ESC: true, isUp: true });
    expect(closeSpy).toHaveBeenCalledOnce();
  });

  it('should toggle on ENTER on the menu btn when in hover mode', async () => {
    const { menu, menuBtn, root } = await getContext({ mode: 'hover' });
    document.body.append(root);
    const toggleSpy = vi.spyOn(menu, 'toggle');
    menuBtn.focus();
    expect(document.activeElement).toBe(menuBtn);
    // @ts-expect-error
    menu.keyed({ isUp: false, ENTER: true });
    expect(toggleSpy).toHaveBeenCalledTimes(0);
    // @ts-expect-error
    menu.keyed({ isUp: true, ENTER: true });
    expect(toggleSpy).toHaveBeenCalledTimes(1);
    // @ts-expect-error
    menu.keyed({ isUp: true, ENTER: true });
    expect(toggleSpy).toHaveBeenCalledTimes(2);
  });

  it('should toggle on btn click when in click mode', async () => {
    const { menu, menuBtn } = await getContext();
    const toggleSpy = vi.spyOn(menu, 'toggle');
    let event = new MouseEvent('click');
    let preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    preventDefaultSpy.mockImplementation(() => null);
    menuBtn.dispatchEvent(event);
    expect(toggleSpy).toHaveBeenCalledTimes(1);
    expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
    event = new MouseEvent('click', { bubbles: true });
    preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    menuBtn.dispatchEvent(event);
    expect(toggleSpy).toHaveBeenCalledTimes(2);
    expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
  });

  it('should NOT toggle on btn click when NOT in click mode', async () => {
    const { menu, menuBtn } = await getContext({ mode: 'hover' });
    const toggleSpy = vi.spyOn(menu, 'toggle');
    let event = new MouseEvent('click');
    let preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    preventDefaultSpy.mockImplementation(() => null);
    menuBtn.dispatchEvent(event);
    expect(toggleSpy).toHaveBeenCalledTimes(0);
    expect(preventDefaultSpy).toHaveBeenCalledTimes(0);
    event = new MouseEvent('click', { bubbles: true });
    preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    menuBtn.dispatchEvent(event);
    expect(toggleSpy).toHaveBeenCalledTimes(0);
    expect(preventDefaultSpy).toHaveBeenCalledTimes(0);
  });

  it('should open on btn mouseenter when in hover mode', async () => {
    const { menu, menuBtn } = await getContext({ mode: 'hover' });
    const openSpy = vi.spyOn(menu, 'open');
    let event = new MouseEvent('mouseenter');
    menuBtn.dispatchEvent(event);
    expect(openSpy).toHaveBeenCalledTimes(1);
  });

  it('should close on btn or list mouseleave when in hover mode', async () => {
    const { menu, menuBtn, menuList } = await getContext({ mode: 'hover' });
    const closeSpy = vi.spyOn(menu, 'close');
    let event = new MouseEvent('mouseleave');
    menuBtn.dispatchEvent(event);
    await wait(1);
    expect(closeSpy).toHaveBeenCalledTimes(1);
    event = new MouseEvent('mouseleave');
    menuList.dispatchEvent(event);
    await wait(1);
    expect(closeSpy).toHaveBeenCalledTimes(2);
  });

  it('should NOT close on btn or list mouseleave when NOT in hover mode', async () => {
    const { menu, menuBtn, menuList } = await getContext();
    const closeSpy = vi.spyOn(menu, 'close');
    let event = new MouseEvent('mouseleave');
    menuBtn.dispatchEvent(event);
    await wait(1);
    expect(closeSpy).toHaveBeenCalledTimes(0);
    event = new MouseEvent('mouseleave');
    menuList.dispatchEvent(event);
    await wait(1);
    expect(closeSpy).toHaveBeenCalledTimes(0);
  });

  it('should close when clicking outside of its elements', async () => {
    const { menu, root } = await getContext();
    document.body.append(root);
    const closeSpy = vi.spyOn(menu, 'close');
    menu.open();
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(closeSpy).toHaveBeenCalledOnce();

    root.remove();
  });

  it('should close other MenuList instance when one is open', async () => {
    const menuListA = h('div', { dataComponent: 'MenuList' });
    const menuListB = h('div', { dataComponent: 'MenuList' });
    const root = h('div', [menuListA, menuListB]);
    const menu = new Menu(root);
    await mount(menu);

    const menuListAInstance = getInstanceFromElement(menuListA, MenuList);
    const menuListBInstance = getInstanceFromElement(menuListB, MenuList);
    const closeSpyA = vi.spyOn(menuListAInstance, 'close');
    const closeSpyB = vi.spyOn(menuListBInstance, 'close');

    menu.onMenuListItemsOpen({ target: menuListAInstance })

    expect(closeSpyA).toHaveBeenCalledTimes(0);
    expect(closeSpyB).toHaveBeenCalledTimes(1);
  });
});
