import { describe, it, vi, expect, afterEach } from 'vitest';
import { Action, Target } from '@studiometa/ui';
import { ActionEvent } from '#private/atoms/Action/ActionEvent.js';
import { h, mount, destroy, Foo } from '#test-utils';

describe('The Action component', () => {
  it('should define a callable effect property based on the effect option', async () => {
    const spy = vi.spyOn(console, 'log');
    spy.mockImplementation(() => {});
    const actionEvent = new ActionEvent(new Action(h('div')), 'click', 'console.log(ctx)');
    actionEvent.effect('foo');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('foo');
    spy.mockRestore();
  });

  it('should return a callable function from the effect property', async () => {
    const spy = vi.spyOn(console, 'log');
    spy.mockImplementation(() => {});
    const actionEvent = new ActionEvent(
      new Action(h('div')),
      'click',
      '(...args) => console.log(...args)',
    );
    const callback = actionEvent.effect();
    expect(typeof callback).toBe('function');
    callback('foo');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('foo');
    spy.mockRestore();
  });

  it('should resolve targets to self if option is not set', async () => {
    const action = new Action(h('div'));
    const actionEvent = new ActionEvent(action, 'click', '(...args) => console.log(...args)');
    expect(actionEvent.targets).toEqual([{ Action: action }]);
  });

  it('should resolve single target', async () => {
    const action = new Action(h('div'));
    const target = new Target(h('div'));
    await mount(action, target);
    const actionEvent = new ActionEvent(action, 'click', 'Target -> target');
    expect(actionEvent.targets).toEqual([{ Target: target }]);
    await destroy(action, target);
  });

  it('should resolve multiple targets', async () => {
    const action = new Action(h('div'));
    const target = new Target(h('div'));
    const foo = new Foo(h('div'));
    await mount(action, target, foo);
    const actionEvent = new ActionEvent(action, 'click', 'Target Foo -> target');
    expect(actionEvent.targets).toEqual([{ Target: target }, { Foo: foo }]);
    await destroy(action, target, foo);
  });

  it('should resolve targets with selectors', async () => {
    const action = new Action(h('div'));
    const targetA = new Target(h('div', { id: 'a' }));
    const targetB = new Target(h('div'));
    await mount(action, targetA, targetB);
    const actionEvent = new ActionEvent(action, 'click', 'Target(#a) -> target');
    expect(actionEvent.targets).toEqual([{ Target: targetA }]);
    await destroy(action, targetA, targetB);
  });

  it.todo(
    'should fail to resolve targets silently when the target string can not be parsed',
    async () => {
      // @todo
    },
  );

  it('should prevent default and stop propagation if modifiers specified', async () => {
    const action = new Action(h('div'));
    await mount(action);
    const actionEvent = new ActionEvent(action, 'click.prevent.stop', 'target');
    actionEvent.attachEvent();
    const event = new Event('click');
    const preventSpy = vi.spyOn(event, 'preventDefault');
    const stopSpy = vi.spyOn(event, 'stopPropagation');
    action.$el.dispatchEvent(event);
    expect(preventSpy).toHaveBeenCalledTimes(1);
    expect(stopSpy).toHaveBeenCalledTimes(1);
    await destroy(action);
    preventSpy.mockRestore();
    stopSpy.mockRestore();
  });

  it('should configure the addEventListener options if modifiers specified', async () => {
    const action = new Action(h('div'));
    await mount(action);
    const actionEvent = new ActionEvent(action, 'click.capture.once.passive', 'target');
    const addEventSpy = vi.spyOn(action.$el, 'addEventListener');
    actionEvent.attachEvent();
    expect(addEventSpy).toHaveBeenCalledTimes(1);
    expect(addEventSpy).toHaveBeenCalledWith('click', actionEvent, {
      capture: true,
      once: true,
      passive: true,
    });
    await destroy(action);
    addEventSpy.mockRestore();
  });

  it('should warn when the effect throws an error', async () => {
    const action = new Action(h('div'));
    const warnSpy = vi.spyOn(action, '$warn');
    const actionEvent = new ActionEvent(action, 'click', '() => consol.log()');
    actionEvent.attachEvent();
    action.$el.dispatchEvent(new Event('click'));
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });
});
