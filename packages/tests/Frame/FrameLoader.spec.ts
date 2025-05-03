import { describe, it, expect, vi } from 'vitest';
import { FrameLoader } from '@studiometa/ui';
import { h, mount } from '#test-utils';

describe('The AbstractFrameTrigger class', () => {
  it('should always have the `...Keep` options active', async () => {
    const div = h('div');
    const frameLoader = new FrameLoader(div);
    await mount(frameLoader);
    expect(frameLoader.$options.enterKeep).toBe(true);
    expect(frameLoader.$options.leaveKeep).toBe(true);
    div.setAttribute('data-option-no-enter-keep', '');
    div.setAttribute('data-option-no-leave-keep', '');
    expect(frameLoader.$options.enterKeep).toBe(true);
    expect(frameLoader.$options.leaveKeep).toBe(true);
  });
});
