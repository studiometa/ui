import type {
  Base,
  BaseDecorator,
  BaseProps,
  BaseConfig,
  BaseInterface,
} from '@studiometa/js-toolkit';
import { clamp, isString, randomInt, wrap } from '@studiometa/js-toolkit/utils';

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
  goTo(indexOrInstruction: number | IndexableInstructions): Promise<void>;

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
      return 0;
    }

    get minIndex() {
      return 0;
    }

    get maxIndex() {
      return Math.max(this.length - 1, 0);
    }

    get currentIndex() {
      return this.__index;
    }

    set currentIndex(value) {
      const oldIndex = this.__index;
      this.__index = this._normalizeIndex(value);
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
     * Get the travel direction: `1` when going forward, `-1` when reversed.
     * @private
     */
    get _direction(): number {
      return this.isReverse ? -1 : 1;
    }

    /**
     * Normalize any value to a valid index according to the current boundary.
     * @private
     */
    _normalizeIndex(value: number): number {
      switch (this.boundary) {
        case INDEXABLE_BOUNDARIES.BOUNCE:
          return this._bounceIndex(value);
        case INDEXABLE_BOUNDARIES.LOOP:
          return this._loopIndex(value);
        case INDEXABLE_BOUNDARIES.CLAMP:
        default:
          return clamp(value, this.minIndex, this.maxIndex);
      }
    }

    /**
     * Wrap a value within the `0...length` range. Returns `0` when the length
     * is not a positive finite number.
     * @private
     */
    _loopIndex(value: number): number {
      const { length } = this;

      if (!Number.isFinite(length) || length <= 0) {
        return 0;
      }

      return wrap(value, 0, length);
    }

    /**
     * Reflect a value back into the `minIndex...maxIndex` range, ping-pong
     * style. Only normalizes the position: the travel direction is left
     * untouched as it is managed by `goNext` and `goPrev`.
     * @private
     */
    _bounceIndex(value: number): number {
      const cycleLength = this.length * 2 - 2;

      if (!Number.isFinite(cycleLength) || cycleLength <= 0) {
        return 0;
      }

      const wrapped = wrap(value, 0, cycleLength);

      return wrapped > this.maxIndex ? cycleLength - wrapped : wrapped;
    }

    /**
     * Compute the index reached by stepping `direction` (`1` or `-1`) with the
     * `bounce` boundary, reflecting at the bounds. Returns the target index and
     * whether a bounce reversed the travel direction.
     * @private
     */
    _bounceStep(direction: number): { index: number; reversed: boolean } {
      const tentative = this.currentIndex + direction;
      const reversed = tentative > this.maxIndex || tentative < this.minIndex;

      return { index: this._bounceIndex(tentative), reversed };
    }

    get prevIndex() {
      return this._normalizeIndex(this.currentIndex - this._direction);
    }

    get nextIndex() {
      return this._normalizeIndex(this.currentIndex + this._direction);
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
      return this._step(this._direction);
    }

    goPrev() {
      return this._step(-this._direction);
    }

    /**
     * Go one step in the given direction (`1` or `-1`), bouncing back with the
     * `bounce` boundary when reaching a bound.
     * @private
     */
    _step(direction: number) {
      if (this.boundary === INDEXABLE_BOUNDARIES.BOUNCE) {
        const { index, reversed } = this._bounceStep(direction);
        if (reversed) {
          this.isReverse = !this.isReverse;
        }
        return this.goTo(index);
      }
      return this.goTo(this._normalizeIndex(this.currentIndex + direction));
    }
  }

  // @ts-ignore — the decorated class matches the declared decorator return type.
  return Indexable;
}
