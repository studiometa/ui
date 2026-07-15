import { describe, it, vi, expect } from 'vitest';
import { Base } from '@studiometa/js-toolkit';
import { Action, DataScope } from '@studiometa/ui';
import { h, mount, destroy } from '#test-utils';

async function getContext({
  effect = 'console.log(...arguments);',
  target = '',
  on = 'click',
} = {}) {
  const spy = vi.spyOn(console, 'log');
  spy.mockImplementation(() => {});

  const fooFn = vi.fn();
  class Foo extends Base {
    static config = {
      name: 'Foo',
    };

    fn(...args) {
      fooFn(...args);
    }
  }

  class Bar extends Base {
    static config = {
      name: 'Bar',
    };
  }

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
    Foo,
    fooFn,
    barRoot,
    bar,
    Bar,
    spy,
    async reset() {
      spy.mockRestore();
      await destroy(action, foo, bar);
    },
  };
}

describe('The Action component', () => {
  it('should react on click by default', async () => {
    const { action, fooFn, reset } = await getContext({
      target: 'Foo',
      effect: 'target.fn()',
    });
    action.$el.dispatchEvent(new Event('click'));
    expect(fooFn).toHaveBeenCalledTimes(1);
    await reset();
  });

  it('should react on the given event', async () => {
    const { action, fooFn, reset } = await getContext({
      target: 'Foo',
      on: 'mouseenter',
      effect: '(ctx) => ctx.Foo.fn()',
    });
    action.$el.dispatchEvent(new Event('mouseenter'));
    action.$el.dispatchEvent(new Event('click'));
    expect(fooFn).toHaveBeenCalledTimes(1);
    await reset();
  });

  it('should trigger the effect with the right parameters', async () => {
    const { action, foo, fooFn, reset } = await getContext({
      target: 'Foo',
      effect: 'target.fn(this, ...arguments)',
    });
    const event = new Event('click');
    action.$el.dispatchEvent(event);
    expect(fooFn).toHaveBeenCalledWith(action.$el, { Foo: foo }, event, foo, action, action, foo.$el, action);
    await reset();
  });

  it('should trigger the effect with all instances mounted on the action element', async () => {
    const { action, fooFn, reset, Bar, root } = await getContext({
      target: 'Foo',
      effect: 'target.fn(Action, Bar)',
    });
    const bar = new Bar(root);
    await mount(bar);
    action.$el.dispatchEvent(new Event('click'));
    expect(fooFn).toHaveBeenCalledWith(action, bar);
    await reset();
  });

  it('should trigger the effect returned function with the right parameters', async () => {
    const { action, foo, fooFn, reset } = await getContext({
      target: 'Foo',
      effect: 'function() { target.fn(this, ...arguments); }',
    });
    const event = new Event('click');
    action.$el.dispatchEvent(event);
    console.info(fooFn.mock.calls.at(-1).length);
    expect(fooFn).toHaveBeenCalledWith(action.$el, { Foo: foo }, event, foo, action, action, foo.$el, action);
    await reset();
  });

  it('should listen to advanced configured events', async () => {
    const div = h('div', {
      id: 'bar',
      'data-on:click': 'target.$el.id = "foo"',
    });
    const action = new Action(div);
    await mount(action);
    expect(action.$el.id).toBe('bar');
    action.$el.dispatchEvent(new Event('click'));
    expect(action.$el.id).toBe('foo');
  });

  it('should work with multiline effects', async () => {
    const div = h('div', {
      id: 'bar',
      'data-on:click': `
        Action(#bar)
        ->
        target.$el.id = true
          ? "foo"
          : "bar"
      `,
    });
    const action = new Action(div);
    await mount(action);
    expect(action.$el.id).toBe('bar');
    action.$el.dispatchEvent(new Event('click'));
    expect(action.$el.id).toBe('foo');
  });

  it('should only target instances in the nearest DataScope', async () => {
    const fn = vi.fn();
    class Foo extends Base {
      static config = { name: 'Foo' };

      run() {
        fn(this);
      }
    }

    const scopeRoot = h('div');
    const actionRoot = h('button', {
      dataOptionTarget: 'Foo',
      dataOptionEffect: 'target.run()',
    });
    const localRoot = h('div');
    const nestedScopeRoot = h('div');
    const nestedRoot = h('div');
    nestedScopeRoot.append(nestedRoot);
    scopeRoot.append(actionRoot, localRoot, nestedScopeRoot);

    const siblingScopeRoot = h('div');
    const siblingRoot = h('div');
    siblingScopeRoot.append(siblingRoot);
    const globalRoot = h('div');

    const scope = new DataScope(scopeRoot);
    const nestedScope = new DataScope(nestedScopeRoot);
    const siblingScope = new DataScope(siblingScopeRoot);
    const action = new Action(actionRoot);
    const local = new Foo(localRoot);
    const nested = new Foo(nestedRoot);
    const sibling = new Foo(siblingRoot);
    const global = new Foo(globalRoot);
    await mount(scope, nestedScope, siblingScope, action, local, nested, sibling, global);

    actionRoot.dispatchEvent(new Event('click'));
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(local);

    await destroy(scope, nestedScope, siblingScope, action, local, nested, sibling, global);
  });
});
