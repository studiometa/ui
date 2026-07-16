import { it, describe, expect, vi } from 'vitest';
import {
  Action,
  DataBind,
  DataComputed,
  DataEffect,
  DataModel,
  DataScope,
  type DataValue,
} from '@studiometa/ui';
import { nextTick } from '@studiometa/js-toolkit/utils';
import { destroy, hConnected as h, mount } from '#test-utils';

describe('The DataBind component', () => {
  it('should set the textContent of the root element', () => {
    const div = h('div');
    const instance = new DataBind(div);
    expect(div.textContent).toBe('');
    expect(instance.get()).toBe('');
    instance.set('foo');
    expect(div.textContent).toBe('foo');
    expect(instance.get()).toBe('foo');
  });

  it('should set the defined property if given', () => {
    const div = h('div', { dataOptionProp: 'name' });
    const instance = new DataBind(div);
    expect(div.textContent).toBe('');
    expect(div.name).toBeUndefined();
    expect(instance.get()).toBeUndefined();
    instance.set('foo');
    expect(div.textContent).toBe('');
    expect(div.name).toBe('foo');
    expect(instance.get()).toBe('foo');
  });

  it('should set the value of an input', () => {
    const input = h('input', { value: 'foo' });
    const instance = new DataBind(input);
    expect(input.value).toBe('foo');
    expect(instance.get()).toBe('foo');
    instance.set('bar');
    expect(input.value).toBe('bar');
    expect(instance.get()).toBe('bar');
  });

  it('should clear typed input properties with nullish values', () => {
    const dateElement = h('input', { type: 'date', value: '2026-01-01' });
    const date = new DataBind(dateElement);
    expect(() => date.set(undefined)).not.toThrow();
    expect(dateElement.value).toBe('');

    const numberElement = h('input', { type: 'number', value: '42' });
    const number = new DataBind(numberElement);
    number.set(null);
    expect(numberElement.value).toBe('');
  });

  it('should set the checked property of a checkbox', () => {
    const input = h('input', { type: 'checkbox' });
    const instance = new DataBind(input);
    expect(input.checked).toBe(false);
    expect(instance.get()).toBe(false);
    instance.set(true);
    expect(input.checked).toBe(true);
    expect(instance.get()).toBe(true);
  });

  it('should set the checked property of multiple checkbox', async () => {
    const inputA = h('input', { type: 'checkbox', value: 'foo', dataOptionGroup: 'checkbox[]' });
    const inputB = h('input', { type: 'checkbox', value: 'bar', dataOptionGroup: 'checkbox[]' });
    const instanceA = new DataBind(inputA);
    const instanceB = new DataBind(inputB);

    await mount(instanceA, instanceB);

    expect(inputA.checked).toBe(false);
    expect(inputB.checked).toBe(false);
    expect(instanceA.get()).toEqual([]);
    expect(instanceB.get()).toEqual([]);
    instanceA.set([inputA.value]);
    instanceB.set([inputA.value]);
    expect(inputA.checked).toBe(true);
    expect(inputB.checked).toBe(false);
    expect(instanceA.get()).toEqual([inputA.value]);
    expect(instanceB.get()).toEqual([inputA.value]);
  });

  it('should set the checked property of a radio', () => {
    const input = h('input', { value: 'foo', type: 'radio' });
    const instance = new DataBind(input);
    expect(input.checked).toBe(false);
    expect(instance.get()).toBe('foo');
    instance.set('foo');
    expect(input.checked).toBe(true);
    expect(instance.get()).toBe('foo');
    instance.set('bar');
    expect(input.checked).toBe(false);
  });

  it('should select an option of a select', () => {
    const optionA = h('option', { value: 'foo' }, ['Foo']);
    const optionB = h('option', { value: 'bar' }, ['Bar']);
    const select = h('select', { dataOptionGroup: 'select' }, [optionA, optionB]);
    const instance = new DataBind(select);
    expect(optionA.selected).toBe(true);
    expect(optionB.selected).toBe(false);
    expect(instance.get()).toBe(optionA.value);
    instance.set(optionB.value);
    expect(optionA.selected).toBe(false);
    expect(optionB.selected).toBe(true);
    expect(instance.get()).toBe(optionB.value);
  });

  it('should select multiple option of a select multiple', () => {
    const optionA = h('option', { value: 'foo', selected: true }, ['Foo']);
    const optionB = h('option', { value: 'bar' }, ['Bar']);
    const optionC = h('option', { value: 'baz' }, ['Baz']);
    const select = h('select', { multiple: true, dataOptionGroup: 'select[]' }, [
      optionA,
      optionB,
      optionC,
    ]);
    const instance = new DataBind(select);
    expect(optionA.selected).toBe(true);
    expect(optionB.selected).toBe(false);
    expect(optionC.selected).toBe(false);
    expect(instance.get()).toEqual([optionA.value]);
    instance.set([optionA.value, optionB.value]);
    expect(optionA.selected).toBe(true);
    expect(optionB.selected).toBe(true);
    expect(optionC.selected).toBe(false);
    expect(instance.get()).toEqual([optionA.value, optionB.value]);
  });

  it('should remove the current instance from the related set after destroy', async () => {
    const divA = h('div');
    const divB = h('div');
    const instanceA = new DataBind(divA);
    const instanceB = new DataBind(divB);
    expect(instanceA.relatedInstances).toBe(instanceB.relatedInstances);
    expect(instanceA.relatedInstances).toEqual(new Set([]));
    expect(instanceB.relatedInstances).toEqual(new Set([]));

    await mount(instanceA, instanceB);

    expect(instanceA.relatedInstances).toEqual(new Set([instanceA, instanceB]));
    expect(instanceB.relatedInstances).toEqual(new Set([instanceA, instanceB]));

    await destroy(instanceB);

    expect(instanceA.relatedInstances).toEqual(new Set([instanceA]));
    expect(instanceB.relatedInstances).toEqual(new Set([instanceA]));

    await destroy(instanceA);

    expect(instanceA.relatedInstances).toEqual(new Set([]));
    expect(instanceB.relatedInstances).toEqual(new Set([]));
  });

  it('should have a `value` getter and setter as alias for the get and set methods', async () => {
    const instance = new DataBind(h('div', ['foo']));
    const spyGet = vi.spyOn(instance, 'get');
    const spySet = vi.spyOn(instance, 'set');
    expect(instance.value).toBe(instance.get());
    expect(spyGet).toHaveBeenCalledTimes(2);
    instance.value = 'bar';
    expect(spySet).toHaveBeenCalledTimes(1);
    expect(spySet).toHaveBeenLastCalledWith('bar');
  });

  it('should toggle between default and custom values', () => {
    const checkbox = new DataBind(h('input', { type: 'checkbox' }));
    checkbox.toggle();
    expect(checkbox.value).toBe(true);
    checkbox.toggle();
    expect(checkbox.value).toBe(false);
    checkbox.toggle('open', 'closed');
    expect(checkbox.value).toBe(false);

    const radioElement = h('input', { type: 'radio', value: 'one' });
    const radio = new DataBind(radioElement);
    radio.toggle('one', '');
    expect(radioElement.checked).toBe(false);

    const state = new DataBind(h('div'));
    state.toggle('open', 'closed');
    expect(state.value).toBe('open');
    state.toggle('open', 'closed');
    expect(state.value).toBe('closed');

    const numericState = new DataBind(h('input', { type: 'text' }));
    numericState.toggle(1, 0);
    expect(numericState.value).toBe('1');
    numericState.toggle(1, 0);
    expect(numericState.value).toBe('0');
  });

  it('should mutate scoped values from an Action', async () => {
    const root = h('div', { dataOptionGroup: 'disclosure' });
    const stateElement = h('div', { class: 'state', dataOptionKey: 'state' });
    const button = h('button', {
      dataOptionTarget: 'DataBind(.state)',
      dataOptionEffect: "target.toggle('open', 'closed')",
    });
    root.append(stateElement, button);

    const scope = new DataScope(root);
    const state = new DataBind(stateElement);
    const action = new Action(button);
    await mount(scope, state, action);

    button.dispatchEvent(new Event('click'));
    expect(state.value).toBe('open');
    expect(state.$data).toEqual({ state: 'open' });

    button.dispatchEvent(new Event('click'));
    expect(state.value).toBe('closed');
    expect(state.$data).toEqual({ state: 'closed' });

    await destroy(scope, state, action);
  });

  it('should increment numeric values and recover from non-numeric values', () => {
    const instance = new DataBind(h('div', ['2']));

    instance.increment();
    expect(instance.value).toBe('3');
    instance.increment(-2);
    expect(instance.value).toBe('1');
    instance.value = 'invalid';
    instance.increment(5);
    expect(instance.value).toBe('5');

    const dateElement = h('input', { type: 'date', value: '2026-01-01' });
    const date = new DataBind(dateElement);
    date.increment();
    expect(dateElement.value).toBe('2026-01-01');
  });

  it('should cycle through values', () => {
    const instance = new DataBind(h('div', ['one']));
    const values = ['one', 'two', 'three'];

    instance.cycle(values);
    expect(instance.value).toBe('two');
    instance.cycle(values);
    expect(instance.value).toBe('three');
    instance.cycle(values);
    expect(instance.value).toBe('one');

    instance.value = 'unknown';
    instance.cycle(values);
    expect(instance.value).toBe('one');
    instance.cycle([]);
    expect(instance.value).toBe('one');

    const numeric = new DataBind(h('input', { type: 'text', value: '1' }));
    numeric.cycle([1, 2, 3]);
    expect(numeric.value).toBe('2');

    const array = new DataBind(h('div', ['one,two']));
    array.cycle([
      ['one', 'two'],
      ['three', 'four'],
    ]);
    expect(array.value).toBe('three,four');

    const raw = new DataBind(
      h('div', {
        'data-bind:attr.data-value': 'value',
      }),
    );
    raw.set('false');
    raw.cycle([false, 'false', true]);
    expect(raw.value).toBe(true);
  });

  it('should reject mutation helpers on computed values and effects', () => {
    const computed = new DataComputed(
      h('div', { dataOptionCompute: 'value' }, ['current']),
    );
    computed.toggle('next', 'current');
    expect(computed.value).toBe('current');

    const effectElement = h('div', {
      dataOptionEffect: 'target.dataset.called = "true"',
    });
    const effect = new DataEffect(effectElement);
    effect.increment();
    expect(effectElement.dataset.called).toBeUndefined();
  });

  it('should dispatch value to other instances', async () => {
    const instance1 = new DataBind(h('div', { dataOptionGroup: 'a' }, ['foo']));
    const instance2 = new DataBind(h('div', { dataOptionGroup: 'a' }, ['foo']));
    const instance3 = new DataComputed(
      h('div', { dataOptionGroup: 'a', dataOptionCompute: 'value + value' }, ['foofoo']),
    );
    const instance4 = new DataEffect(
      h('div', { dataOptionGroup: 'a', dataOptionEffect: 'target.id = value', id: 'foo' }),
    );

    await mount(instance1, instance2, instance3, instance4);

    expect(instance1.value).toBe('foo');
    expect(instance2.value).toBe('foo');
    expect(instance3.value).toBe('foofoo');
    expect(instance4.$el.id).toBe('foo');
    instance1.value = 'bar';
    expect(instance1.value).toBe('bar');
    expect(instance2.value).toBe('bar');
    expect(instance3.value).toBe('barbar');
    expect(instance4.$el.id).toBe('bar');
  });

  it('should deliver group updates through the public set method', async () => {
    const legacySource = new DataBind(h('div', { dataOptionGroup: 'custom-set' }));
    const legacySubscriber = new DataBind(h('div', { dataOptionGroup: 'custom-set' }));
    const legacySet = vi.spyOn(legacySubscriber, 'set');
    await mount(legacySource, legacySubscriber);

    legacySource.set('legacy');
    expect(legacySet).toHaveBeenCalledWith('legacy', false);

    const root = h('div', { dataOptionGroup: 'person' });
    const input = h('input', { name: 'first' });
    const output = h('div', { dataOptionKey: 'first' });
    root.append(input, output);
    const scope = new DataScope(root);
    const scopedSource = new DataModel(input);
    const scopedSubscriber = new DataBind(output);
    const scopedSet = vi.spyOn(scopedSubscriber, 'set');
    await mount(scope, scopedSource, scopedSubscriber);

    scopedSource.set('scoped');
    expect(scopedSet).toHaveBeenCalledWith('scoped', false);

    await destroy(legacySource, legacySubscriber, scope, scopedSource, scopedSubscriber);
  });

  it('should preserve the latest value during reentrant group updates', async () => {
    class ReentrantDataBind extends DataBind {
      private dispatched = false;

      set(value: DataValue, dispatch = true) {
        super.set(value, dispatch);

        if (!dispatch && value === 'outer' && !this.dispatched) {
          this.dispatched = true;
          super.set('inner');
        }
      }
    }

    const source = new DataBind(h('div', { dataOptionGroup: 'reentrant' }));
    const reentrant = new ReentrantDataBind(h('div', { dataOptionGroup: 'reentrant' }));
    const output = new DataBind(h('div', { dataOptionGroup: 'reentrant' }));
    await mount(source, reentrant, output);

    source.set('outer');

    expect(source.value).toBe('inner');
    expect(reentrant.value).toBe('inner');
    expect(output.value).toBe('inner');

    await destroy(source, reentrant, output);
  });

  it('should not run effects on mount unless an immediate value is dispatched', async () => {
    const passiveElement = h('div', {
      dataOptionGroup: 'passive-effect',
      dataOptionEffect: 'target.dataset.called = "true"',
    });
    const immediateElement = h('div', {
      dataOptionGroup: 'immediate-effect',
      dataOptionEffect:
        'target.dataset.calls = String(Number(target.dataset.calls || 0) + 1)',
      dataOptionImmediate: true,
    });
    const passive = new DataEffect(passiveElement);
    const immediate = new DataEffect(immediateElement);

    await mount(passive, immediate);
    expect(passiveElement.dataset.called).toBeUndefined();
    expect(immediateElement.dataset.calls).toBeUndefined();

    await nextTick();
    expect(passiveElement.dataset.called).toBeUndefined();
    expect(immediateElement.dataset.calls).toBe('1');

    await destroy(passive, immediate);
  });

  it('should dispose and recreate group subscriptions across lifecycle changes', async () => {
    const source = new DataBind(h('div', { dataOptionGroup: 'lifecycle' }));
    const effectElement = h('div', {
      dataOptionGroup: 'lifecycle',
      dataOptionEffect:
        'target.dataset.calls = String(Number(target.dataset.calls || 0) + 1)',
    });
    const effect = new DataEffect(effectElement);
    await mount(source, effect);

    source.set('first');
    expect(effectElement.dataset.calls).toBe('1');

    await destroy(effect);
    source.set('second');
    expect(effectElement.dataset.calls).toBe('1');

    await mount(effect);
    source.set('third');
    expect(effectElement.dataset.calls).toBe('2');

    await destroy(source, effect);
  });

  it('should forget related instances not in the DOM anymore', async () => {
    const fragment = new Document();
    const inputA = h('input', {
      type: 'checkbox',
      value: 'foo',
      checked: '',
      dataOptionGroup: 'checkbox[]',
    });
    const inputB = h('input', {
      type: 'checkbox',
      value: 'bar',
      checked: '',
      dataOptionGroup: 'checkbox[]',
    });
    fragment.append(inputA, inputB);

    const instanceA = new DataBind(inputA);
    const instanceB = new DataBind(inputB);

    await mount(instanceA, instanceB);

    expect(inputA.isConnected).toBe(true);
    expect(inputB.isConnected).toBe(true);
    expect(instanceA.value).toEqual(['foo', 'bar']);

    inputB.replaceWith(
      h('input', { type: 'checkbox', value: 'bar', dataOptionGroup: 'checkbox[]' }),
    );

    expect(inputA.isConnected).toBe(true);
    expect(inputB.isConnected).toBe(false);
    expect(instanceA.value).toEqual(['foo']);
  });

  it('should return value as number for input[type="number"] by default', async () => {
    const bind1 = new DataBind(h('input', { type: 'number', dataOptionGroup: 'one' }));
    const bind2 = new DataBind(h('input', { type: 'number', value: '1', dataOptionGroup: 'two' }));
    await mount(bind1, bind2);
    expect(bind1.value).toBeNaN();
    expect(bind2.value).toBe(1);
    bind1.value = 10;
    bind2.value = '20';
    expect(bind1.value).toBe(10);
    expect(bind2.value).toBe(20);
  });

  it('should return value as date for input[type="date"] by default', async () => {
    const bind1 = new DataBind(h('input', { type: 'date', dataOptionGroup: 'one' }));
    const bind2 = new DataBind(
      h('input', { type: 'date', value: '2025-01-01', dataOptionGroup: 'two' }),
    );
    await mount(bind1, bind2);
    expect(bind1.value).toBeNull();
    expect(bind2.value).toEqual(new Date('2025-01-01'));
    bind1.value = new Date('2025-01-02');
    bind2.value = new Date('2025-01-03');
    expect(bind1.value).toEqual(new Date('2025-01-02'));
    expect(bind2.value).toEqual(new Date('2025-01-03'));
  });

  it('should propagate its value on mount when the immediate option is enabled', async () => {
    const bind1 = new DataBind(
      h('input', {
        type: 'text',
        dataOptionGroup: 'immediate',
        value: 'foo',
        dataOptionImmediate: true,
      }),
    );
    const bind2 = new DataBind(h('input', { type: 'text', dataOptionGroup: 'immediate' }));
    await mount(bind1, bind2);
    await nextTick();
    expect(bind2.value).toBe('foo');
  });

  it('should apply multiple virtual prop, attr, class, style and text bindings', () => {
    const button = h(
      'button',
      {
        'data-bind:prop.disabled': '!value',
        'data-bind:prop.tab-index': 'value ? 0 : -1',
        'data-bind:attr.aria-pressed': 'String(Boolean(value))',
        'data-bind:class.is-active': 'value',
        'data-bind:style.display': 'value ? "block" : "none"',
        'data-bind:text': '`Selected: ${value}`',
      },
      ['Original label'],
    );
    const instance = new DataBind(button);

    instance.set(true);

    expect(button.disabled).toBe(false);
    expect(button.tabIndex).toBe(0);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.classList.contains('is-active')).toBe(true);
    expect(button.style.display).toBe('block');
    expect(button.textContent).toBe('Selected: true');
  });

  it('should retain the raw value applied through virtual bindings', async () => {
    const button = h('button', {
      'data-bind:attr.aria-expanded': 'String(value === "open")',
    });
    const instance = new DataBind(button);

    instance.set('open');
    expect(instance.value).toBe('open');
    expect(button.getAttribute('aria-expanded')).toBe('true');

    instance.toggle('open', 'closed');
    expect(instance.value).toBe('closed');
    expect(button.getAttribute('aria-expanded')).toBe('false');

    const input = h('input', {
      value: 'initial',
      'data-bind:attr.data-value': 'value',
    });
    const model = new DataModel(input);
    await mount(model);
    model.set('initial');
    input.value = 'edited';
    model.dispatch();
    expect(model.value).toBe('edited');
    expect(input.dataset.value).toBe('edited');
    await destroy(model);
  });

  it('should resolve acronym-cased DOM properties', () => {
    const div = h('div', {
      'data-bind:prop.inner-html': '`<strong>${value}</strong>`',
    });
    const instance = new DataBind(div);

    instance.set('Content');

    expect(div.innerHTML).toBe('<strong>Content</strong>');
    expect((div as HTMLElement & { innerHtml?: string }).innerHtml).toBeUndefined();
  });

  it('should pass the raw value through empty virtual bindings', () => {
    const div = h('div', {
      'data-bind:prop.title': '',
      'data-bind:attr.data-value': '',
      'data-bind:class.selected': '',
      'data-bind:style.--state': '',
      'data-bind:text': '',
    });
    const instance = new DataBind(div);

    instance.set('visible');

    expect(div.title).toBe('visible');
    expect(div.dataset.value).toBe('visible');
    expect(div.classList.contains('selected')).toBe(true);
    expect(div.style.getPropertyValue('--state')).toBe('visible');
    expect(div.textContent).toBe('visible');

    instance.set(undefined);
    expect(div.title).toBe('');
    expect(div.hasAttribute('data-value')).toBe(false);
    expect(div.classList.contains('selected')).toBe(false);
    expect(div.style.getPropertyValue('--state')).toBe('');
    expect(div.textContent).toBe('');
  });

  it('should use scoped data in virtual binding expressions', () => {
    const root = h('div', { dataOptionGroup: 'tabs' });
    const button = h('button', {
      'data-bind:attr.aria-selected': '$data.active === value',
      'data-bind:class.is-active': '$data.active === value',
    });
    root.append(button);
    const scope = new DataScope(root);
    const instance = new DataBind(button);
    scope.setValue('tabs', 'active', 'details');

    instance.set('details');

    expect(button.getAttribute('aria-selected')).toBe('');
    expect(button.classList.contains('is-active')).toBe(true);
  });

  it('should remove attributes and clear styles according to binding semantics', () => {
    const div = h('div', {
      'data-bind:attr.hidden': 'value',
      'data-bind:style.--state': 'value',
    });
    const instance = new DataBind(div);

    instance.set(true);
    expect(div.getAttribute('hidden')).toBe('');
    expect(div.style.getPropertyValue('--state')).toBe('true');

    for (const value of [false, null, undefined]) {
      instance.set(value);
      expect(div.hasAttribute('hidden')).toBe(false);
      expect(div.style.getPropertyValue('--state')).toBe('');
    }

    instance.set(0);
    expect(div.getAttribute('hidden')).toBe('0');
    expect(div.style.getPropertyValue('--state')).toBe('0');
  });

  it('should fail quietly when a virtual binding expression throws', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const div = h('div', {
      'data-bind:attr.title': 'missing.value',
      'data-bind:text': '`Value: ${value}`',
    });
    const instance = new DataBind(div);

    expect(() => instance.set('foo')).not.toThrow();
    expect(div.hasAttribute('title')).toBe(false);
    expect(div.textContent).toBe('Value: foo');
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });

  it('should update virtual subscribers when their legacy value equals the dispatched value', async () => {
    const source = new DataBind(h('div', { dataOptionGroup: 'equal' }, ['foo']));
    const button = h(
      'button',
      {
        dataOptionGroup: 'equal',
        'data-bind:attr.data-value': 'value',
      },
      ['foo'],
    );
    const subscriber = new DataBind(button);
    await mount(source, subscriber);

    source.set('foo');

    expect(button.dataset.value).toBe('foo');
    expect(button.textContent).toBe('foo');
  });

  it('should coexist with Action virtual events without option collisions', async () => {
    const button = h('button', {
      'data-on:click': 'target.$el.dataset.clicked = "true"',
      'data-bind:class.is-active': 'value',
    });
    const action = new Action(button);
    const bind = new DataBind(button);
    await mount(action, bind);

    bind.set(true);
    button.dispatchEvent(new Event('click'));

    expect(button.classList.contains('is-active')).toBe(true);
    expect(button.dataset.clicked).toBe('true');
  });

  it('should preserve the legacy single-property behavior without virtual bindings', () => {
    const button = h('button', { dataOptionProp: 'disabled' }, ['Label']);
    const instance = new DataBind(button);

    instance.set(true);

    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe('Label');
  });
});
