import { it, describe, expect, jest } from '@jest/globals';
import { DataBind } from '@studiometa/ui';
import { h } from '#test-utils';

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
    const inputA = h('input', { type: 'checkbox', value: 'foo', dataOptionName: 'checkbox[]' });
    const inputB = h('input', { type: 'checkbox', value: 'bar', dataOptionName: 'checkbox[]' });
    const instanceA = new DataBind(inputA);
    const instanceB = new DataBind(inputB);
    jest.useFakeTimers();
    instanceA.$mount();
    instanceB.$mount();
    await jest.advanceTimersByTimeAsync(100);
    jest.useRealTimers();
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
    const select = h('select', { dataOptionName: 'select' }, [optionA, optionB]);
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
    const select = h('select', { multiple: true, dataOptionName: 'select[]' }, [
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
    jest.useFakeTimers();
    instanceA.$mount();
    instanceB.$mount();
    await jest.advanceTimersByTimeAsync(100);
    expect(instanceA.relatedInstances).toEqual(new Set([instanceA, instanceB]));
    expect(instanceB.relatedInstances).toEqual(new Set([instanceA, instanceB]));
    instanceB.$destroy();
    await jest.advanceTimersByTimeAsync(100);
    expect(instanceA.relatedInstances).toEqual(new Set([instanceA]));
    expect(instanceB.relatedInstances).toEqual(new Set([instanceA]));
    instanceA.$destroy();
    await jest.advanceTimersByTimeAsync(100);
    jest.useRealTimers();
    expect(instanceA.relatedInstances).toEqual(new Set([]));
    expect(instanceB.relatedInstances).toEqual(new Set([]));
  });
});
