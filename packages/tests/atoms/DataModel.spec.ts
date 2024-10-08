import { it, describe, expect } from 'vitest';
import { DataModel } from '@studiometa/ui';
import { hConnected as h, mount } from '#test-utils';

function check(input: HTMLInputElement, checked = true) {
  input.checked = checked;
  input.dispatchEvent(new Event('input'));
}

describe('The DataModel component', () => {
  it('should sync values on input', async () => {
    const value = 'foo';
    const newValue = 'bar';
    const inputA = h('input', { value });
    const inputB = h('input', { value });
    const instanceA = new DataModel(inputA);
    const instanceB = new DataModel(inputB);

    await mount(instanceA, instanceB);

    expect(instanceA.get()).toBe(instanceB.get());
    expect(instanceA.get()).toBe(value);
    expect(instanceB.get()).toBe(value);
    inputA.value = newValue;
    inputA.dispatchEvent(new CustomEvent('input'));
    expect(instanceA.get()).toBe(instanceB.get());
    expect(instanceA.get()).toBe(newValue);
    expect(instanceB.get()).toBe(newValue);
  });

  it('should set value for multiple checkboxes with the same name', async () => {
    const checkboxA1 = h('input', { type: 'checkbox', value: 'a', dataOptionGroup: 'check[]' });
    const checkboxA2 = h('input', { type: 'checkbox', value: 'a', dataOptionGroup: 'check[]' });
    const checkboxB1 = h('input', { type: 'checkbox', value: 'b', dataOptionGroup: 'check[]' });
    const checkboxB2 = h('input', { type: 'checkbox', value: 'b', dataOptionGroup: 'check[]' });
    const instanceA1 = new DataModel(checkboxA1);
    const instanceA2 = new DataModel(checkboxA2);
    const instanceB1 = new DataModel(checkboxB1);
    const instanceB2 = new DataModel(checkboxB2);

    await mount(instanceA1, instanceA2, instanceB1, instanceB2);

    expect(instanceA1.multiple).toBe(true);

    check(checkboxA1, true);
    expect(instanceA1.value).toEqual(['a']);
    expect(instanceA2.value).toEqual(['a']);
    expect(instanceB1.value).toEqual(['a']);
    expect(instanceB2.value).toEqual(['a']);

    check(checkboxA1, false);
    expect(instanceA1.value).toEqual([]);
    expect(instanceA2.value).toEqual([]);
    expect(instanceB1.value).toEqual([]);
    expect(instanceB2.value).toEqual([]);

    check(checkboxA1, true);
    check(checkboxA2, true);
    expect(instanceA1.value).toEqual(['a']);
    expect(instanceA2.value).toEqual(['a']);
    expect(instanceB1.value).toEqual(['a']);
    expect(instanceB2.value).toEqual(['a']);

    check(checkboxA1, false);
    expect(instanceA1.value).toEqual([]);
    expect(instanceA2.value).toEqual([]);
    expect(instanceB1.value).toEqual([]);
    expect(instanceB2.value).toEqual([]);
  });
});
