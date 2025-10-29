import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Indexable } from '@studiometa/ui';
import { h } from '#test-utils';

class TestIndexable extends Indexable {
  #length = 3;

  get length() {
    return this.#length;
  }

  set length(value: number) {
    this.#length = value;
  }
}

describe('The Indexable class', () => {
  let indexable: TestIndexable;
  let element: HTMLElement;

  beforeEach(() => {
    element = h('div');
    indexable = new TestIndexable(element);
  });

  describe(`"${Indexable.MODES.NORMAL}" mode`, () => {
    beforeEach(() => {
      indexable.mode = Indexable.MODES.NORMAL;
    });

    it('should stay in bounds indexes', () => {
      indexable.currentIndex = 0;
      expect(indexable.nextIndex).toBe(1);
      expect(indexable.prevIndex).toBe(0);

      indexable.currentIndex = 2;
      expect(indexable.nextIndex).toBe(2);
      expect(indexable.prevIndex).toBe(1);
    });
  });

  describe(`"${Indexable.MODES.INFINITE}" mode`, () => {
    beforeEach(() => {
      indexable.mode = Indexable.MODES.INFINITE;
    });

    it('should wrap around indexes', () => {
      indexable.currentIndex = 0;
      expect(indexable.nextIndex).toBe(1);
      expect(indexable.prevIndex).toBe(2); // (0 - 1 + 3) % 3 = 2

      indexable.currentIndex = 2;
      expect(indexable.nextIndex).toBe(0); // (2 + 1) % 3 = 0
      expect(indexable.prevIndex).toBe(1);
    });

    it('should handle out of bounds indexes', () => {
      indexable.currentIndex = -1;
      expect(indexable.currentIndex).toBe(2); // (-1 + 3) % 3 = 2

      indexable.currentIndex = 5;
      expect(indexable.currentIndex).toBe(2); // (5) % 3 = 2
    });
  });

  describe(`"${Indexable.MODES.ALTERNATE}" mode`, () => {
    beforeEach(() => {
      indexable.mode = Indexable.MODES.ALTERNATE;
    });

    it('should alternate direction when reaching bounds', () => {
      indexable.currentIndex = 0;
      expect(indexable.nextIndex).toBe(1);
      expect(indexable.prevIndex).toBe(1);

      indexable.currentIndex = 2;
      expect(indexable.nextIndex).toBe(1);
      expect(indexable.prevIndex).toBe(1);
    });

    it('should handle out of bounds indexes', () => {
      indexable.currentIndex = -1;
      expect(indexable.currentIndex).toBe(1);

      indexable.currentIndex = 5;
      expect(indexable.currentIndex).toBe(1);
    });
  });

  describe('goTo method', () => {
    it('should go to specific index', async () => {
      const emitSpy = vi.spyOn(indexable, '$emit');

      await indexable.goTo(1);
      expect(indexable.currentIndex).toBe(1);
      expect(emitSpy).toHaveBeenCalledWith('index', 1);
    });

    it(`should handle "${Indexable.INSTRUCTIONS.NEXT}" instruction`, async () => {
      await indexable.goTo(Indexable.INSTRUCTIONS.NEXT);
      expect(indexable.currentIndex).toBe(1);
    });

    it(`should handle "${Indexable.INSTRUCTIONS.PREVIOUS}" instruction`, async () => {
      indexable.currentIndex = 1;
      await indexable.goTo(Indexable.INSTRUCTIONS.PREVIOUS);
      expect(indexable.currentIndex).toBe(0);
    });

    it(`should handle "${Indexable.INSTRUCTIONS.FIRST}" instruction`, async () => {
      indexable.currentIndex = 2;
      await indexable.goTo(Indexable.INSTRUCTIONS.FIRST);
      expect(indexable.currentIndex).toBe(0);
    });

    it(`should handle "${Indexable.INSTRUCTIONS.LAST}" instruction`, async () => {
      await indexable.goTo(Indexable.INSTRUCTIONS.LAST);
      expect(indexable.currentIndex).toBe(2);
    });

    it(`should handle "${Indexable.INSTRUCTIONS.RANDOM}" instruction`, async () => {
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

      await indexable.goTo(Indexable.INSTRUCTIONS.RANDOM);
      expect(indexable.currentIndex).toBeGreaterThanOrEqual(0);
      expect(indexable.currentIndex).toBeLessThanOrEqual(2);

      randomSpy.mockRestore();
    });

    it('should handle reverse with instructions', async () => {
      indexable.isReverse = true;

      indexable.currentIndex = 1;
      await indexable.goTo(Indexable.INSTRUCTIONS.PREVIOUS);
      expect(indexable.currentIndex).toBe(2);

      indexable.currentIndex = 1;
      await indexable.goTo(Indexable.INSTRUCTIONS.NEXT);
      expect(indexable.currentIndex).toBe(0);

      await indexable.goTo(Indexable.INSTRUCTIONS.FIRST);
      expect(indexable.currentIndex).toBe(2);

      await indexable.goTo(Indexable.INSTRUCTIONS.LAST);
      expect(indexable.currentIndex).toBe(0);
    });

    it('should reject invalid instruction', async () => {
      const warnSpy = vi.spyOn(indexable, '$warn');

      await expect(indexable.goTo('invalid' as any)).rejects.toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith('Invalid goto instruction.');
      expect(indexable.currentIndex).toBe(0);
    });
  });
});
