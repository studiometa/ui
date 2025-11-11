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

    await mount(transitionA, transitionB);
    expect(transitionA.$options.group).toBe(transitionB.$options.group);
    expect(transitionA.targets).toEqual(transitionB.targets);
  });

  it('should toggle between enter and leave states', async () => {
    const div = h('div');
    const transition = new Transition(div);
    await mount(transition);

    expect(transition.state).toBe(null);

    await transition.toggle();
    expect(transition.state).toBe(transition.constructor.STATES.ENTERING);

    await transition.toggle();
    expect(transition.state).toBe(transition.constructor.STATES.LEAVING);

    await transition.toggle();
    expect(transition.state).toBe(transition.constructor.STATES.ENTERING);
  });

  it('should track state as entering when enter is called', async () => {
    const div = h('div');
    const transition = new Transition(div);
    await mount(transition);

    await transition.enter();
    expect(transition.state).toBe(transition.constructor.STATES.ENTERING);
  });

  it('should track state as leaving when leave is called', async () => {
    const div = h('div');
    const transition = new Transition(div);
    await mount(transition);

    await transition.leave();
    expect(transition.state).toBe(transition.constructor.STATES.LEAVING);
  });

  it('should emit transition-toggle event when toggle is called', async () => {
    const div = h('div');
    const transition = new Transition(div);
    await mount(transition);

    const emitSpy = vi.spyOn(transition, '$emit');
    await transition.toggle();

    expect(emitSpy).toHaveBeenCalledWith(
      transition.constructor.EVENTS.TRANSITION_TOGGLE,
    );
  });

  it('should emit transition-enter events when enter is called', async () => {
    const div = h('div');
    const transition = new Transition(div);
    await mount(transition);

    const emitSpy = vi.spyOn(transition, '$emit');
    await transition.enter();

    expect(emitSpy).toHaveBeenCalledWith(
      transition.constructor.EVENTS.TRANSITION_ENTER,
    );
    expect(emitSpy).toHaveBeenCalledWith(
      transition.constructor.EVENTS.TRANSITION_ENTER_START,
    );
    expect(emitSpy).toHaveBeenCalledWith(
      transition.constructor.EVENTS.TRANSITION_ENTER_END,
    );
  });

  it('should emit transition-leave events when leave is called', async () => {
    const div = h('div');
    const transition = new Transition(div);
    await mount(transition);

    const emitSpy = vi.spyOn(transition, '$emit');
    await transition.leave();

    expect(emitSpy).toHaveBeenCalledWith(
      transition.constructor.EVENTS.TRANSITION_LEAVE,
    );
    expect(emitSpy).toHaveBeenCalledWith(
      transition.constructor.EVENTS.TRANSITION_LEAVE_START,
    );
    expect(emitSpy).toHaveBeenCalledWith(
      transition.constructor.EVENTS.TRANSITION_LEAVE_END,
    );
  });
});
