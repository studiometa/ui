import { describe, it, expect, vi } from 'vitest';
import { Menu, MenuBtn, MenuList } from '@studiometa/ui';
import { h } from '#test-utils';

async function getContext() {
  const menuBtn = h('button', { dataComponent: 'MenuBtn' }, ['Click me']);
  const menuList = h('div', { dataComponent: 'MenuList' });
  const root = h('div', [menuBtn, menuList]);
  const menu = new Menu(root);
  await menu.$mount();
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
    await menu.$mount();
    expect(menu.$isMounted).toBe(false);
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
});
