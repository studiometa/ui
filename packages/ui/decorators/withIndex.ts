import type {
  Base,
  BaseDecorator,
  BaseProps,
  BaseConfig,
  BaseInterface,
} from '@studiometa/js-toolkit';
import { clamp, isString, randomInt } from '@studiometa/js-toolkit/utils';

const INDEXABLE_BOUNDARIES = {
  CLAMP: 'clamp',
  LOOP: 'loop',
  BOUNCE: 'bounce',
} as const;

export type IndexableBoundary = (typeof INDEXABLE_BOUNDARIES)[keyof typeof INDEXABLE_BOUNDARIES];

const INDEXABLE_INSTRUCTIONS = {
  NEXT: 'next',
  PREVIOUS: 'previous',
  FIRST: 'first',
  LAST: 'last',
  RANDOM: 'random',
} as const;

export type IndexableInstructions =
  (typeof INDEXABLE_INSTRUCTIONS)[keyof typeof INDEXABLE_INSTRUCTIONS];

export interface IndexableProps extends BaseProps {
  $options: {
    boundary: IndexableBoundary;
    reverse: boolean;
  };
}

export interface IndexableInterface extends BaseInterface {
  /**
   * Index storage.
   */
  __index: number;

  /**
   * Is reverse ?
   */
  get isReverse(): boolean;
  set isReverse(value: boolean);

  /**
   * Get the boundary behavior.
   */
  get boundary(): IndexableBoundary;
  set boundary(value: IndexableBoundary);

  /**
   * Get the length.
   */
  get length(): number;

  /**
   * Get the minimum index.
   */
  get minIndex(): number;

  /**
   * Get the maximum index.
   */
  get maxIndex(): number;

  /**
   * Get the current index.
   */
  get currentIndex(): number;
  set currentIndex(value: number);

  /**
   * Get the first index.
   */
  get firstIndex(): number;

  /**
   * Get the last index.
   */
  get lastIndex(): number;

  /**
   * Get the previous index.
   */
  get prevIndex(): number;

  /**
   * Get the next index.
   */
  get nextIndex(): number;

  /**
   * Go to the specified index or instruction.
   */
  goTo(indexOrInstruction?: number | IndexableInstructions): Promise<void>;

  /**
   * Go to the next index.
   */
  goNext(): Promise<void>;

  /**
   * Go to the previous index.
   */
  goPrev(): Promise<void>;
}

/**
 * Extend a class to add index management.
 */
export function withIndex<S extends Base>(
  BaseClass: typeof Base,
): BaseDecorator<IndexableInterface, S, IndexableProps> & {
  BOUNDARIES: typeof INDEXABLE_BOUNDARIES;
  INSTRUCTIONS: typeof INDEXABLE_INSTRUCTIONS;
} {
  /**
   * Class.
   */
  class Indexable<T extends BaseProps = BaseProps> extends BaseClass<T & IndexableProps> {
    /**
     * Config.
     */
    static config: BaseConfig = {
      ...BaseClass.config,
      emits: ['index'],
      options: {
        boundary: {
          type: String,
          default: INDEXABLE_BOUNDARIES.CLAMP,
        },
        reverse: Boolean,
      },
    };

    static BOUNDARIES = INDEXABLE_BOUNDARIES;

    static INSTRUCTIONS = INDEXABLE_INSTRUCTIONS;

    __index = 0;

    get isReverse() {
      return this.$options.reverse === true;
    }

    set isReverse(value) {
      this.$options.reverse = !!value;
    }

    get boundary() {
      const { boundary } = this.$options;

      if (!Object.values(INDEXABLE_BOUNDARIES).includes(boundary)) {
        return INDEXABLE_BOUNDARIES.CLAMP;
      }

      return boundary;
    }

    set boundary(value) {
      this.$options.boundary = Object.values(INDEXABLE_BOUNDARIES).includes(value)
        ? value
        : INDEXABLE_BOUNDARIES.CLAMP;
    }

    get length() {
      this.$warn(
        'The length property should be overridden to match with the actual number of items. Finite length is required for the loop and bounce boundaries.',
      );
      return Number.POSITIVE_INFINITY;
    }

    get minIndex() {
      return 0;
    }

    get maxIndex() {
      return this.length - 1;
    }

    get currentIndex() {
      return this.__index;
    }

    set currentIndex(value) {
      const oldIndex = this.__index;
      switch (this.boundary) {
        case INDEXABLE_BOUNDARIES.BOUNCE: {
          // Reflect out-of-bounds values back into range.
          const cycleLength = this.length * 2 - 2;
          if (cycleLength <= 0) {
            this.__index = 0;
            break;
          }
          let normalized = ((value % cycleLength) + cycleLength) % cycleLength;
          if (normalized > this.maxIndex) {
            normalized = cycleLength - normalized;
          }
          if (value < this.minIndex || value > this.maxIndex) {
            this.isReverse = !this.isReverse;
          }
          this.__index = normalized;
          break;
        }
        case INDEXABLE_BOUNDARIES.LOOP:
          this.__index = ((value % this.length) + this.length) % this.length;
          break;
        case INDEXABLE_BOUNDARIES.CLAMP:
        default:
          this.__index = clamp(value, this.minIndex, this.maxIndex);
          break;
      }
      if (this.__index !== oldIndex) {
        this.$emit('index', this.currentIndex);
      }
    }

    get firstIndex() {
      return this.isReverse ? this.maxIndex : this.minIndex;
    }

    get lastIndex() {
      return this.isReverse ? this.minIndex : this.maxIndex;
    }

    /**
     * Compute the index reached by stepping `direction` (`1` or `-1`) with the
     * `bounce` boundary, reflecting at the bounds. Returns the target index and
     * whether a bounce reversed the travel direction.
     * @private
     */
    _bounceStep(direction: number): { index: number; reversed: boolean } {
      const tentative = this.currentIndex + direction;

      if (tentative > this.maxIndex) {
        return { index: Math.max(this.maxIndex - 1, this.minIndex), reversed: true };
      }

      if (tentative < this.minIndex) {
        return { index: Math.min(this.minIndex + 1, this.maxIndex), reversed: true };
      }

      return { index: tentative, reversed: false };
    }

    get prevIndex() {
      if (this.boundary === INDEXABLE_BOUNDARIES.BOUNCE) {
        return this._bounceStep(this.isReverse ? 1 : -1).index;
      }

      const rawIndex = this.isReverse ? this.currentIndex + 1 : this.currentIndex - 1;

      return this.boundary === INDEXABLE_BOUNDARIES.CLAMP
        ? clamp(rawIndex, this.minIndex, this.maxIndex)
        : ((rawIndex % this.length) + this.length) % this.length;
    }

    get nextIndex() {
      if (this.boundary === INDEXABLE_BOUNDARIES.BOUNCE) {
        return this._bounceStep(this.isReverse ? -1 : 1).index;
      }

      const rawIndex = this.isReverse ? this.currentIndex - 1 : this.currentIndex + 1;

      return this.boundary === INDEXABLE_BOUNDARIES.CLAMP
        ? clamp(rawIndex, this.minIndex, this.maxIndex)
        : ((rawIndex % this.length) + this.length) % this.length;
    }

    goTo(indexOrInstruction) {
      if (isString(indexOrInstruction)) {
        switch (indexOrInstruction) {
          case INDEXABLE_INSTRUCTIONS.NEXT:
            return this.goNext();
          case INDEXABLE_INSTRUCTIONS.PREVIOUS:
            return this.goPrev();
          case INDEXABLE_INSTRUCTIONS.FIRST:
            return this.goTo(this.firstIndex);
          case INDEXABLE_INSTRUCTIONS.LAST:
            return this.goTo(this.lastIndex);
          case INDEXABLE_INSTRUCTIONS.RANDOM:
            // @TODO: eventually store previous indexes to avoid duplicates
            return this.goTo(randomInt(this.minIndex, this.maxIndex));
          default:
            this.$warn('Invalid goto instruction.');
            return Promise.resolve();
        }
      }
      this.currentIndex = indexOrInstruction;
      return Promise.resolve();
    }

    goNext() {
      if (this.boundary === INDEXABLE_BOUNDARIES.BOUNCE) {
        const { index, reversed } = this._bounceStep(this.isReverse ? -1 : 1);
        if (reversed) {
          this.isReverse = !this.isReverse;
        }
        return this.goTo(index);
      }
      return this.goTo(this.nextIndex);
    }

    goPrev() {
      if (this.boundary === INDEXABLE_BOUNDARIES.BOUNCE) {
        const { index, reversed } = this._bounceStep(this.isReverse ? 1 : -1);
        if (reversed) {
          this.isReverse = !this.isReverse;
        }
        return this.goTo(index);
      }
      return this.goTo(this.prevIndex);
    }
  }

  // @ts-ignore — the decorated class matches the declared decorator return type.
  return Indexable;
}
