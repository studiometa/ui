import { it, describe, expect, jest } from '@jest/globals';
import { Base } from '@studiometa/js-toolkit';
import { DataComputed } from '@studiometa/ui';
import { h } from '#test-utils';

describe('The DataModel component', () => {
  it('should set the value as the returned value from the compute option', () => {
    const value = 'foo';
    const div = h('div', { dataOptionCompute: 'value.length' });
    const instance = new DataComputed(div);
    instance.set(value);
    expect(div.textContent).toBe(value.length.toString());
  });

  it('should fail quietly if the compute callback throws an error', () => {
    const consoleSpy = jest.spyOn(console, 'error');
    consoleSpy.mockImplementation(() => {});
    const value = 'foo';
    const div = h('div', { dataOptionCompute: 'valuee.length' });
    const instance = new DataComputed(div);
    expect(() => {
      instance.set(value);
    }).not.toThrow();
    expect(instance.get()).toBe(value);
    consoleSpy.mockReset();
  });
});
