import { describe, it, jest, expect, beforeEach } from '@jest/globals';
import { Base } from '@studiometa/js-toolkit';
import { Action as ActionCore } from '@studiometa/ui';

class Action extends ActionCore {
  static config = {
    ...ActionCore.config,
    warn: true,
  };

  static warnFn = jest.fn();

  $warn(...args) {
    Action.warnFn();
    super.$warn(...args);
  }
}

class Foo extends Base {
  static config = {
    name: 'Foo',
  };

  static fn = jest.fn();

  fn() {
    Foo.fn();
  }
}

class Bar extends Base {
  static config = {
    name: 'Bar',
  };

  static fn = jest.fn();

  fn() {
    Bar.fn();
  }
}

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Action,
      Foo,
      Bar,
    },
  };
}

const root = document.createElement('div');
root.innerHTML = `
  <div data-component="Foo"></div>
  <div data-component="Bar"></div>
  <button data-component="Action"
    data-option-method="fn"
    data-option-target="Foo">Click me</button>
  <button data-component="Action"
    data-option-method="fn"
    data-option-target="Foo Bar">Click me</button>
  <button data-component="Action"
    data-option-on="focus"
    data-option-method="fn"
    data-option-target="Foo">Focus me</button>
  <button data-component="Action"
    data-option-method="fn"
    data-option-target="Baz">Click me</button>
  <button data-component="Action"
    data-option-method="unavailableFn"
    data-option-target="Foo">Click me</button>
`;
const app = new App(root);
app.$mount();
const [action1, action2, action3, action4, action5] = app.$children.Action;

beforeEach(() => {
  Foo.fn.mockReset();
  Bar.fn.mockReset();
  Action.warnFn.mockReset();
});

describe('The Action component', () => {
  it('should trigger a method on another component on click', () => {
    action1.$el.click();
    expect(Foo.fn).toHaveBeenCalledTimes(1);
  });

  it('should trigger a method on multiple components on click', () => {
    action2.$el.click();
    expect(Foo.fn).toHaveBeenCalledTimes(1);
    expect(Bar.fn).toHaveBeenCalledTimes(1);
  });

  it('should trigger a method from another component on any event', () => {
    action3.$el.dispatchEvent(new FocusEvent('focus'));
    expect(Foo.fn).toHaveBeenCalledTimes(1);
  });

  it('should display a warning if the targeted component does not exist', () => {
    action4.$el.click();
    expect(Action.warnFn).toHaveBeenCalledTimes(1);
  });

  it('should display a warning if the targeted method does not exist', () => {
    action5.$el.click();
    expect(Action.warnFn).toHaveBeenCalledTimes(1);
  });
});
