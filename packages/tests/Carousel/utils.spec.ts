import { describe, it, expect } from 'vitest';
import { getClosestIndex } from '#private/Carousel/utils.js';

describe('The getClosestIndex function', () => {
  it('should return the closest index', () => {
    const fixtures = [
      [[0, 1, 2, 3] as number[], 1, 1],
      [[0.1, 0.2, 0.3, 0.4] as number[], 0.222, 1],
    ] as const;

    for (const [numbers, target, result] of fixtures) {
      expect(getClosestIndex(numbers, target)).toBe(result);
    }
  });
});
