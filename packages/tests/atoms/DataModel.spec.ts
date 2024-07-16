import { it, describe, expect, jest } from '@jest/globals';
import { Base } from '@studiometa/js-toolkit';
import { DataModel } from '@studiometa/ui';
import { h } from '#test-utils';

describe('The DataModel component', () => {
  it('should sync values on input', async () => {
    const value = 'foo';
    const newValue = 'bar';
    const inputA = h('input', { value });
    const inputB = h('input', { value });
    const instanceA = new DataModel(inputA);
    const instanceB = new DataModel(inputB);
    jest.useFakeTimers();
    instanceA.$mount();
    instanceB.$mount();
    await jest.advanceTimersByTimeAsync(100);
    jest.useRealTimers();
    expect(instanceA.get()).toBe(instanceB.get());
    expect(instanceA.get()).toBe(value);
    expect(instanceB.get()).toBe(value);
    inputA.value = newValue;
    inputA.dispatchEvent(new CustomEvent('input'));
    expect(instanceA.get()).toBe(instanceB.get());
    expect(instanceA.get()).toBe(newValue);
    expect(instanceB.get()).toBe(newValue);
  });
});
