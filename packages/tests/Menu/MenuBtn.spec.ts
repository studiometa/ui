import { describe, it, expect, vi } from 'vitest';
import { MenuBtn } from '@studiometa/ui';
import { h, mount } from '#test-utils';

describe('The MenuBtn component', () => {
  it('should switch its `isHover` state', async () => {
    const btn = h('button');
    const menuBtn = new MenuBtn(btn);
    await mount(menuBtn);
    expect(menuBtn.isHover).toBe(false);
    const mouseenterEvent = new MouseEvent('mouseenter');
    const mouseenterPropagationSpy = vi.spyOn(mouseenterEvent, 'stopPropagation');
    btn.dispatchEvent(mouseenterEvent);
    expect(menuBtn.isHover).toBe(true);
    expect(mouseenterPropagationSpy).toHaveBeenCalledOnce();
    const mouseleaveEvent = new MouseEvent('mouseleave');
    const mouseleavePropagationSpy = vi.spyOn(mouseleaveEvent, 'stopPropagation');
    btn.dispatchEvent(mouseleaveEvent);
    expect(menuBtn.isHover).toBe(false);
    expect(mouseleavePropagationSpy).toHaveBeenCalledOnce();
  });
});
