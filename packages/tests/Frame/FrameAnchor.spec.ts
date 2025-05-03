import { describe, it, expect, vi } from 'vitest';
import { FrameAnchor } from '@studiometa/ui';
import { h, mount } from '#test-utils';

describe('The FrameAnchor class', () => {
  it('should trigger when the link is clicked', async () => {
    const anchor = h('a', { href: '/#' });
    const frameAnchor = new FrameAnchor(anchor);
    const fn = vi.fn();
    frameAnchor.$on('frame-trigger', (event: CustomEvent) => fn(event));
    await mount(frameAnchor);
    const event = new MouseEvent('click');
    const spy = vi.spyOn(event, 'preventDefault');
    anchor.dispatchEvent(event);
    expect(fn).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should not trigger when the link target is `_blank`', async () => {
    const anchor = h('a', { href: '/#', target: '_blank' });
    const frameAnchor = new FrameAnchor(anchor);
    const fn = vi.fn();
    frameAnchor.$on('frame-trigger', (event: CustomEvent) => fn(event));
    await mount(frameAnchor);
    const event = new MouseEvent('click');
    const spy = vi.spyOn(event, 'preventDefault');
    anchor.dispatchEvent(event);
    expect(fn).not.toHaveBeenCalled();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should not trigger when a controller key is pressed while clicking', async () => {
    const anchor = h('a', { href: '/#' });
    const frameAnchor = new FrameAnchor(anchor);
    const fn = vi.fn();
    frameAnchor.$on('frame-trigger', (event: CustomEvent) => fn(event));
    await mount(frameAnchor);
    anchor.dispatchEvent(new MouseEvent('click', { metaKey: true }));
    anchor.dispatchEvent(new MouseEvent('click', { ctrlKey: true }));
    anchor.dispatchEvent(new MouseEvent('click', { altKey: true }));
    anchor.dispatchEvent(new MouseEvent('click', { shiftKey: true }));
    expect(fn).not.toHaveBeenCalled();
  });
});
