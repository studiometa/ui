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

  describe(`"${Indexable.BOUNDARIES.CLAMP}" boundary`, () => {
    beforeEach(() => {
      indexable.boundary = Indexable.BOUNDARIES.CLAMP;
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

  describe(`"${Indexable.BOUNDARIES.LOOP}" boundary`, () => {
    beforeEach(() => {
      indexable.boundary = Indexable.BOUNDARIES.LOOP;
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
      expect(indexable.currentIndex).toBe(2);

      indexable.currentIndex = 5;
      expect(indexable.currentIndex).toBe(2);
    });

    it('should handle large negative indexes', () => {
      indexable.currentIndex = -5;
      expect(indexable.currentIndex).toBe(1); // ((-5 % 3) + 3) % 3 = 1

      indexable.currentIndex = -7;
      expect(indexable.currentIndex).toBe(2); // ((-7 % 3) + 3) % 3 = 2
    });
  });

  describe(`"${Indexable.BOUNDARIES.BOUNCE}" boundary`, () => {
    beforeEach(() => {
      indexable.boundary = Indexable.BOUNDARIES.BOUNCE;
    });

    it('should bounce back when reaching bounds', () => {
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

    it('should not change direction when setting an out of bounds index', () => {
      expect(indexable.isReverse).toBe(false);

      indexable.currentIndex = 5;
      expect(indexable.currentIndex).toBe(1);
      expect(indexable.isReverse).toBe(false);

      indexable.currentIndex = -1;
      expect(indexable.currentIndex).toBe(1);
      expect(indexable.isReverse).toBe(false);
    });

    it('should not change direction when going to an out of bounds index', async () => {
      expect(indexable.isReverse).toBe(false);

      await indexable.goTo(10);
      expect(indexable.currentIndex).toBe(2);
      expect(indexable.isReverse).toBe(false);

      await indexable.goTo(-5);
      expect(indexable.currentIndex).toBe(1);
      expect(indexable.isReverse).toBe(false);
    });

    it('should keep the travel direction after a no-op out of bounds assignment', async () => {
      indexable.currentIndex = 1;

      // -1 reflects back to the current index: no index change, no event,
      // and the direction must stay untouched.
      indexable.currentIndex = -1;
      expect(indexable.currentIndex).toBe(1);
      expect(indexable.isReverse).toBe(false);

      await indexable.goNext();
      expect(indexable.currentIndex).toBe(2);
    });

    it('should ping-pong through indices with goNext', async () => {
      indexable.currentIndex = 0;

      await indexable.goNext();
      expect(indexable.currentIndex).toBe(1);

      await indexable.goNext();
      expect(indexable.currentIndex).toBe(2);

      await indexable.goNext();
      expect(indexable.currentIndex).toBe(1); // bounce back instead of oscillating

      await indexable.goNext();
      expect(indexable.currentIndex).toBe(0);

      await indexable.goNext();
      expect(indexable.currentIndex).toBe(1); // bounce again
    });

    it('should reverse the direction back with goPrev', async () => {
      indexable.currentIndex = 0;

      await indexable.goNext();
      await indexable.goNext();
      expect(indexable.currentIndex).toBe(2);

      await indexable.goPrev();
      expect(indexable.currentIndex).toBe(1);
    });
  });

  describe('default length', () => {
    it('should default to 0 and pin the index at 0', async () => {
      const instance = new Indexable(h('div'));
      expect(instance.length).toBe(0);
      expect(instance.maxIndex).toBe(0);

      await instance.goTo(5);
      expect(instance.currentIndex).toBe(0);

      instance.boundary = Indexable.BOUNDARIES.LOOP;
      await instance.goTo(5);
      expect(instance.currentIndex).toBe(0);

      instance.boundary = Indexable.BOUNDARIES.BOUNCE;
      await instance.goTo(5);
      expect(instance.currentIndex).toBe(0);
    });
  });

  describe('total option', () => {
    it('should derive the length from the `total` option when used standalone', async () => {
      const instance = new Indexable(h('div', { dataOptionTotal: 3 }));
      expect(instance.length).toBe(3);
      expect(instance.maxIndex).toBe(2);
    });

    it('should let a standalone instance navigate within the configured bounds', async () => {
      const instance = new Indexable(h('div', { dataOptionTotal: 3 }));

      await instance.goTo(5);
      expect(instance.currentIndex).toBe(2); // clamped to maxIndex

      instance.boundary = Indexable.BOUNDARIES.LOOP;
      await instance.goTo(3);
      expect(instance.currentIndex).toBe(0); // wraps around
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

    it('should warn and keep the current index for an invalid instruction', async () => {
      const warnSpy = vi.spyOn(indexable, '$warn', 'get');

      await expect(indexable.goTo('invalid' as any)).resolves.toBeUndefined();
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(indexable.currentIndex).toBe(0);
    });

    it.each([undefined, null, true, {}, NaN, Infinity, -Infinity])(
      'should warn and keep the current index for an invalid numeric index: %s',
      async (value) => {
        indexable.currentIndex = 1;
        indexable.boundary = Indexable.BOUNDARIES.LOOP;
        const warnSpy = vi.spyOn(indexable, '$warn', 'get');
        const emitSpy = vi.spyOn(indexable, '$emit');

        await expect(indexable.goTo(value as any)).resolves.toBeUndefined();
        expect(warnSpy).toHaveBeenCalledOnce();
        expect(emitSpy).not.toHaveBeenCalled();
        expect(indexable.currentIndex).toBe(1);
      },
    );

    it('should not emit when the index does not change', async () => {
      const emitSpy = vi.spyOn(indexable, '$emit');

      await indexable.goTo(0); // already at index 0
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });
});
