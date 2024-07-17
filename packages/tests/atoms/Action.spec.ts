import { describe, it, jest, expect, afterEach } from '@jest/globals';
import { Base } from '@studiometa/js-toolkit';
import { Action } from '@studiometa/ui';
import { h, mount, destroy } from '#test-utils';

class Foo extends Base {
  static config = {
    name: 'Foo',
  };
}

class Bar extends Base {
  static config = {
    name: 'Bar',
  };
}

async function getContext({
  effect = 'console.log(...arguments);',
  target = '',
  on = 'click',
} = {}) {
  const spy = jest.spyOn(console, 'log');
  spy.mockImplementation(() => {});

  const root = h('div', {
    dataOptionEffect: effect,
    dataOptionTarget: target,
    dataOptionOn: on,
  });
  const action = new Action(root);

  const fooRoot = h('div', { class: 'foo' });
  const foo = new Foo(fooRoot);
  const barRoot = h('div', { class: 'bar' });
  const bar = new Bar(barRoot);

  await mount(action, foo, bar);

  return {
    action,
    root,
    fooRoot,
    foo,
    barRoot,
    bar,
    spy,
    async reset() {
      spy.mockRestore();
      await destroy(action, foo, bar);
    },
  };
}

describe('The Action component', () => {
  it('should define a callable effect property based on the effect option', async () => {
    const { action, spy, reset } = await getContext();
    action.effect('foo');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('foo');
    await reset();
  });

  it('should return a callable function from the effect property', async () => {
    const { action, spy, reset } = await getContext({
      effect: '(...args) => console.log(...args);',
    });
    const fn = action.effect('foo');
    expect(spy).toHaveBeenCalledTimes(0);
    expect(typeof fn).toBe('function');
    fn('bar');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith('bar');
    await reset();
  });

  it('should resolve single target', async () => {
    const { action, foo, reset } = await getContext({
      target: 'Foo',
    });
    expect(action.targets).toEqual([{ Foo: foo }]);
    await reset();
  });

  it('should resolve multiple targets', async () => {
    const { action, foo, bar, reset } = await getContext({
      target: 'Foo Bar',
    });
    expect(action.targets).toEqual([{ Foo: foo }, { Bar: bar }]);
    await reset();
  });

  it('should resolve targets with selectors', async () => {
    const { action, foo, bar, reset } = await getContext({
      target: "Foo(.foo) Bar([class*='bar'])",
    });
    expect(action.targets).toEqual([{ Foo: foo }, { Bar: bar }]);
    await reset();
  });

  it('should fail to resolve targets silently when the target string can not be parsed', async () => {
    const { action, foo, bar, reset } = await getContext({
      target: '1234 &#',
    });
    expect(action.targets).toEqual([]);
    await reset();
  });

  it('should react on click by default', async () => {
    const { action, foo, reset } = await getContext({
      target: 'Foo',
      effect: 'target.$update()',
    });
    const spy = jest.spyOn(foo, '$update');
    action.$el.dispatchEvent(new Event('click'));
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
    await reset();
  });

  it('should react on the given event', async () => {
    const { action, foo, reset } = await getContext({
      target: 'Foo',
      on: 'mouseenter',
      effect: '(ctx) => ctx.Foo.$update()',
    });
    const spy = jest.spyOn(foo, '$update');
    action.$el.dispatchEvent(new Event('mouseenter'));
    action.$el.dispatchEvent(new Event('click'));
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
    await reset();
  });

  it('should trigger the effect with ctx, target and event parameters', async () => {
    const { action, foo, reset } = await getContext({
      target: 'Foo',
      effect: 'target.$update(ctx, event, target)',
    });
    const spy = jest.spyOn(foo, '$update');
    const event = new Event('click');
    action.$el.dispatchEvent(event);
    expect(spy).toHaveBeenCalledWith(action.targets[0], event, foo);
    spy.mockRestore();
    await reset();
  });

  it('should trigger the effect returned function with ctx, target and event parameters', async () => {
    const { action, foo, reset } = await getContext({
      target: 'Foo',
      effect:
        '(_ctx, _event, _target) => target.$update(ctx, _ctx, event, _event, target, _target)',
    });
    const spy = jest.spyOn(foo, '$update');
    const event = new Event('click');
    action.$el.dispatchEvent(event);
    expect(spy).toHaveBeenCalledWith(action.targets[0], action.targets[0], event, event, foo, foo);
    spy.mockRestore();
    await reset();
  });

  it('should prevent default and stop propagation if modifiers specified', async () => {
    const { action, reset } = await getContext({
      target: 'Foo',
      on: 'click.prevent.stop',
    });
    expect(action.event).toBe('click');
    expect(action.modifiers).toEqual(['prevent', 'stop']);
    const event = new Event('click');
    const preventSpy = jest.spyOn(event, 'preventDefault');
    const stopSpy = jest.spyOn(event, 'stopPropagation');
    action.$el.dispatchEvent(event);
    expect(preventSpy).toHaveBeenCalledTimes(1);
    expect(stopSpy).toHaveBeenCalledTimes(1);
    await reset();
  });

  it('should configure the addEventListener options if modifiers specified', async () => {
    const { action, reset } = await getContext({
      target: 'Foo',
      on: 'click.capture.once.passive',
    });
    expect(action.event).toBe('click');
    expect(action.modifiers).toEqual(['capture', 'once', 'passive']);
    const event = new Event('click');
    action.$el.dispatchEvent(event);
    const addEventSpy = jest.spyOn(action.$el, 'addEventListener');
    await destroy(action);
    await mount(action);
    expect(addEventSpy).toHaveBeenCalledTimes(1);
    expect(addEventSpy).toHaveBeenCalledWith('click', action, {
      capture: true,
      once: true,
      passive: true,
    });
    await reset();
  });

  it('should warn when the effect throws an error', async () => {
    const { action, foo, reset } = await getContext({
      target: 'Foo',
      effect: 'target.undefinedMethod()',
    });
    const spy = jest.spyOn(action, '$warn');
    action.$el.dispatchEvent(new Event('click'));
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
    await reset();
  });
});
