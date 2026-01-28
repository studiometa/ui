import { describe, it, expect } from 'vitest';
import { parseEventDefinition, resolveDetailPlaceholders } from '#private/Track/TrackEvent.js';

describe('parseEventDefinition', () => {
  it('should parse simple event', () => {
    const result = parseEventDefinition('click');
    expect(result).toEqual({
      event: 'click',
      modifiers: [],
      debounceDelay: 0,
      throttleDelay: 0,
    });
  });

  it('should parse event with modifiers', () => {
    const result = parseEventDefinition('click.prevent.stop');
    expect(result).toEqual({
      event: 'click',
      modifiers: ['prevent', 'stop'],
      debounceDelay: 0,
      throttleDelay: 0,
    });
  });

  it('should parse event with default debounce', () => {
    const result = parseEventDefinition('input.debounce');
    expect(result).toEqual({
      event: 'input',
      modifiers: ['debounce'],
      debounceDelay: 300,
      throttleDelay: 0,
    });
  });

  it('should parse event with custom debounce delay', () => {
    const result = parseEventDefinition('input.debounce500');
    expect(result).toEqual({
      event: 'input',
      modifiers: ['debounce'],
      debounceDelay: 500,
      throttleDelay: 0,
    });
  });

  it('should parse event with default throttle', () => {
    const result = parseEventDefinition('scroll.throttle');
    expect(result).toEqual({
      event: 'scroll',
      modifiers: ['throttle'],
      debounceDelay: 0,
      throttleDelay: 16,
    });
  });

  it('should parse event with custom throttle delay', () => {
    const result = parseEventDefinition('mousemove.throttle100');
    expect(result).toEqual({
      event: 'mousemove',
      modifiers: ['throttle'],
      debounceDelay: 0,
      throttleDelay: 100,
    });
  });

  it('should parse event with multiple modifiers including timing', () => {
    const result = parseEventDefinition('click.prevent.stop.debounce200');
    expect(result).toEqual({
      event: 'click',
      modifiers: ['prevent', 'stop', 'debounce'],
      debounceDelay: 200,
      throttleDelay: 0,
    });
  });

  it('should parse all listener option modifiers', () => {
    const result = parseEventDefinition('click.once.passive.capture');
    expect(result).toEqual({
      event: 'click',
      modifiers: ['once', 'passive', 'capture'],
      debounceDelay: 0,
      throttleDelay: 0,
    });
  });
});

describe('resolveDetailPlaceholders', () => {
  it('should resolve simple $detail.* placeholder', () => {
    const data = { event: 'test', email: '$detail.email' };
    const detail = { email: 'test@example.com' };

    const result = resolveDetailPlaceholders(data, detail);

    expect(result).toEqual({
      event: 'test',
      email: 'test@example.com',
    });
  });

  it('should resolve nested $detail.* placeholder', () => {
    const data = { event: 'test', name: '$detail.user.name' };
    const detail = { user: { name: 'John' } };

    const result = resolveDetailPlaceholders(data, detail);

    expect(result).toEqual({
      event: 'test',
      name: 'John',
    });
  });

  it('should resolve deeply nested $detail.* placeholder', () => {
    const data = { city: '$detail.address.location.city' };
    const detail = { address: { location: { city: 'Paris' } } };

    const result = resolveDetailPlaceholders(data, detail);

    expect(result).toEqual({ city: 'Paris' });
  });

  it('should return undefined for missing paths', () => {
    const data = { email: '$detail.missing' };
    const detail = { other: 'value' };

    const result = resolveDetailPlaceholders(data, detail);

    expect(result).toEqual({ email: undefined });
  });

  it('should preserve non-placeholder values', () => {
    const data = { event: 'test', static: 'value', number: 42 };
    const detail = {};

    const result = resolveDetailPlaceholders(data, detail);

    expect(result).toEqual({
      event: 'test',
      static: 'value',
      number: 42,
    });
  });

  it('should resolve placeholders in nested objects', () => {
    const data = {
      event: 'test',
      user: {
        email: '$detail.email',
        name: '$detail.name',
      },
    };
    const detail = { email: 'test@example.com', name: 'John' };

    const result = resolveDetailPlaceholders(data, detail);

    expect(result).toEqual({
      event: 'test',
      user: {
        email: 'test@example.com',
        name: 'John',
      },
    });
  });

  it('should preserve arrays', () => {
    const data = { items: ['a', 'b', 'c'] };
    const detail = {};

    const result = resolveDetailPlaceholders(data, detail);

    expect(result).toEqual({ items: ['a', 'b', 'c'] });
  });
});
