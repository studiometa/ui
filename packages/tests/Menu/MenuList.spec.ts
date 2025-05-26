import { describe, it, expect, vi } from 'vitest';
import { getInstanceFromElement } from '@studiometa/js-toolkit';
import { MenuList } from '@studiometa/ui';
import { h, mount } from '#test-utils';

describe('The MenuList component', () => {
  it('should switch its `isHover` state', async () => {
    const div = h('div');
    const menuList = new MenuList(div);
    await mount(menuList);
    expect(menuList.isHover).toBe(false);
    div.dispatchEvent(new MouseEvent('mouseenter'));
    expect(menuList.isHover).toBe(true);
    div.dispatchEvent(new MouseEvent('mouseleave'));
    expect(menuList.isHover).toBe(false);
  });

  it('should force its enterKeep and leaveKeep options', async () => {
    const div = h('div');
    const menuList = new MenuList(div);
    await mount(menuList);
    expect(menuList.$options.enterKeep).toBe(true);
    expect(menuList.$options.leaveKeep).toBe(true);
  });

  it('should have open an close methods', async () => {
    const div = h('div');
    const menuList = new MenuList(div);
    await mount(menuList);

    const openFn = vi.fn();
    const closeFn = vi.fn();
    menuList.$on('items-open', openFn);
    menuList.$on('items-close', closeFn);

    menuList.open();
    expect(openFn).toHaveBeenCalledTimes(1);
    expect(closeFn).toHaveBeenCalledTimes(0);
    expect(div.getAttribute('aria-hidden')).toBe('false');
    expect(menuList.isOpen).toBe(true);

    menuList.close();
    expect(openFn).toHaveBeenCalledTimes(1);
    expect(closeFn).toHaveBeenCalledTimes(1);
    expect(div.getAttribute('aria-hidden')).toBe('true');
    expect(menuList.isOpen).toBe(false);
  });

  it('should have a toggle method', async () => {
    const div = h('div');
    const menuList = new MenuList(div);
    await mount(menuList);
    const openSpy = vi.spyOn(menuList, 'open');
    const closeSpy = vi.spyOn(menuList, 'close');

    menuList.toggle();
    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(closeSpy).toHaveBeenCalledTimes(0);
    menuList.toggle();
    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(closeSpy).toHaveBeenCalledTimes(1);
    menuList.toggle();
    expect(openSpy).toHaveBeenCalledTimes(2);
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('should remove focus from any focused element', async () => {
    const a = h('a', { href: '#' });
    const div = h('div', [a]);
    document.body.append(div);
    const menuList = new MenuList(div);
    await mount(menuList);
    menuList.open();
    a.focus();
    expect(document.activeElement).toBe(a);
    const blurSpy = vi.spyOn(a, 'blur');
    menuList.close();
    expect(blurSpy).toHaveBeenCalledOnce();
    div.remove();
  });

  it('should close its children MenuList', async () => {
    const nestedDiv = h('div', { dataComponent: 'MenuList' });
    const section = h('section', [nestedDiv]);
    const div = h('div', [section]);
    const menuList = new MenuList(div);
    await mount(menuList);
    const nestedMenuList = getInstanceFromElement(nestedDiv, MenuList);

    menuList.open();
    expect(menuList.isOpen).toBe(true);
    expect(nestedMenuList.isOpen).toBe(false);

    nestedMenuList.open();
    expect(menuList.isOpen).toBe(true);
    expect(nestedMenuList.isOpen).toBe(true);

    nestedMenuList.close();
    expect(menuList.isOpen).toBe(true);
    expect(nestedMenuList.isOpen).toBe(false);

    nestedMenuList.open();
    expect(menuList.isOpen).toBe(true);
    expect(nestedMenuList.isOpen).toBe(true);

    menuList.close();
    expect(menuList.isOpen).toBe(false);
    expect(nestedMenuList.isOpen).toBe(false);
  });

  it('should update its focusable children element tabindex attribute', async () => {
    const nestedA = h('a', { href: '#' });
    const nestedDiv = h('div', { dataComponent: 'MenuList' }, [nestedA]);
    const section = h('section', [nestedDiv]);
    const a = h('a', { href: '#' });
    const div = h('div', [a, section]);
    const menuList = new MenuList(div);
    await mount(menuList);
    const nestedMenuList = getInstanceFromElement(nestedDiv, MenuList);
    expect(nestedMenuList.$isMounted).toBe(true);
    expect(a.getAttribute('tabindex')).toBe('-1');
    expect(nestedA.getAttribute('tabindex')).toBe('-1');

    menuList.open();
    expect(menuList.isOpen).toBe(true);
    expect(nestedMenuList.isOpen).toBe(false);
    expect(a.getAttribute('tabindex')).toBeNull();
    expect(nestedA.getAttribute('tabindex')).toBe('-1');

    nestedMenuList.open();
    expect(menuList.isOpen).toBe(true);
    expect(nestedMenuList.isOpen).toBe(true);
    expect(a.getAttribute('tabindex')).toBeNull();
    expect(nestedA.getAttribute('tabindex')).toBeNull();

    menuList.close();
    expect(menuList.isOpen).toBe(false);
    expect(nestedMenuList.isOpen).toBe(false);
    expect(a.getAttribute('tabindex')).toBe('-1');
    expect(nestedA.getAttribute('tabindex')).toBe('-1');
  });

  it('should prevent multiple call of open and close', async () => {
    const div = h('div');
    const menuList = new MenuList(div);
    await mount(menuList);

    const enterSpy = vi.spyOn(menuList, 'enter');
    const leaveSpy = vi.spyOn(menuList, 'leave');

    menuList.open();
    menuList.open();
    expect(enterSpy).toHaveBeenCalledOnce();
    menuList.close();
    menuList.close();
    expect(leaveSpy).toHaveBeenCalledOnce();
  });
});
