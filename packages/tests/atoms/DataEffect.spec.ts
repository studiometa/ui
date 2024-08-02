import { it, describe, expect, vi } from 'vitest';
import { Base } from '@studiometa/js-toolkit';
import { DataEffect } from '@studiometa/ui';
import { h } from '#test-utils';

describe('The DataModel component', () => {
  it('should execute the compute option without setting a value', () => {
    const value = 'foo';
    const div = h('div', { id: 'id', dataOptionEffect: 'target.setAttribute("id", value)' });
    const instance = new DataEffect(div);
    expect(div.textContent).toBe('');
    expect(div.id).toBe('id');
    instance.set(value);
    expect(div.textContent).toBe('');
    expect(div.id).toBe(value);
  });

  it('should fail quietly if the compute callback throws an error', () => {
    const consoleSpy = vi.spyOn(console, 'error');
    consoleSpy.mockImplementation(() => {});
    const div = h('div', { dataOptionEffect: 'targett.setAttribute("id", value)' });
    const instance = new DataEffect(div);
    expect(div.textContent).toBe('');
    expect(() => {
      instance.set('foo');
    }).not.toThrow();
    expect(instance.get()).toBe('');
    consoleSpy.mockReset();
  });
});
