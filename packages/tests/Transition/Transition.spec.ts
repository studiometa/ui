import { describe, it, expect, vi } from 'vitest';
import { Transition } from '@studiometa/ui';
import { mount, h } from '#test-utils';

describe('The Transition component', () => {
  it('should default to its root element as target', async () => {
    const div = h('div');
    const transition = new Transition(div);
    expect(transition.target).toBe(div);
  });

  it('should dispatch enter and leave method to grouped elements', async () => {
    const opts = { dataOptionGroup: 'group' };
    const transitionA = new Transition(h('div', opts));
    const transitionB = new Transition(h('div', opts));
    const enterMock = vi.spyOn(transitionA, 'enter');
    const leaveMock = vi.spyOn(transitionA, 'enter');

    await mount(transitionA, transitionB);
    expect(transitionA.$options.group).toBe(transitionB.$options.group);
    await transitionB.enter();
    expect(enterMock).toHaveBeenCalledOnce();
    await transitionB.leave();
    expect(leaveMock).toHaveBeenCalledOnce();
  });
});
