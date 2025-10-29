import { it, describe, expect, vi } from 'vitest';
import { DataBind, DataComputed, DataEffect } from '@studiometa/ui';
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
});
