import type {
  Base,
  BaseDecorator,
  BaseProps,
  BaseConfig,
  BaseInterface,
} from '@studiometa/js-toolkit';
import { clamp, isString, randomInt } from '@studiometa/js-toolkit/utils';

const INDEXABLE_MODES = {
  NORMAL: 'normal',
  INFINITE: 'infinite',
  ALTERNATE: 'alternate',
} as const;

export type IndexableMode = typeof INDEXABLE_MODES[keyof typeof INDEXABLE_MODES];

const INDEXABLE_INSTRUCTIONS = {
  NEXT: 'next',
  PREVIOUS: 'previous',
  FIRST: 'first',
  LAST: 'last',
  RANDOM: 'random',
} as const;

export type IndexableInstructions = typeof INDEXABLE_INSTRUCTIONS[keyof typeof INDEXABLE_INSTRUCTIONS];

export interface IndexableProps extends BaseProps {
  $options: {
    mode: IndexableMode;
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
   * Get mode.
   */
  get mode(): IndexableMode;
  set mode(value: IndexableMode);

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
  MODES: typeof INDEXABLE_MODES;
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
        mode: {
          type: String,
          default: INDEXABLE_MODES.NORMAL,
        },
        reverse: Boolean,
      },
    };

    __index = 0;

    get isReverse() {
      return this.$options.reverse === true;
    }

    set isReverse(value) {
      this.$options.reverse = !!value;
    }

    get mode() {
      const { mode } = this.$options;

      if (!Object.values(INDEXABLE_MODES).includes(mode)) {
        return INDEXABLE_MODES.NORMAL;
      }

      return mode;
    }

    set mode(value) {
      this.$options.mode = Object.values(INDEXABLE_MODES).includes(value) ? value : INDEXABLE_MODES.NORMAL;
    }

    get length() {
      this.$warn('The length property should be overridden to match with the actual number of items. Finite length is required for infinite and alternate modes.');
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
      switch (this.mode) {
        case INDEXABLE_MODES.ALTERNATE: {
          // Bounce: reflect out-of-bounds values back into range
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
        case INDEXABLE_MODES.INFINITE:
          this.__index = ((value % this.length) + this.length) % this.length;
          break;
        case INDEXABLE_MODES.NORMAL:
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
     * Check if the given raw index would trigger a direction reversal in alternate mode.
     * @private
     */
    _wouldReverse(rawIndex: number): boolean {
      return this.mode === INDEXABLE_MODES.ALTERNATE
        && (rawIndex > this.maxIndex || rawIndex < this.minIndex);
    }

    get prevIndex() {
      const reverse = this.isReverse;
      let rawIndex = reverse ? this.currentIndex + 1 : this.currentIndex - 1;

      if (this._wouldReverse(rawIndex)) {
        rawIndex = !reverse ? this.currentIndex + 1 : this.currentIndex - 1;
      }

      return this.mode === INDEXABLE_MODES.NORMAL
        ? clamp(rawIndex, this.minIndex, this.maxIndex)
        : ((rawIndex % this.length) + this.length) % this.length;
    }

    get nextIndex() {
      const reverse = this.isReverse;
      let rawIndex = reverse ? this.currentIndex - 1 : this.currentIndex + 1;

      if (this._wouldReverse(rawIndex)) {
        rawIndex = !reverse ? this.currentIndex - 1 : this.currentIndex + 1;
      }

      return this.mode === INDEXABLE_MODES.NORMAL
        ? clamp(rawIndex, this.minIndex, this.maxIndex)
        : ((rawIndex % this.length) + this.length) % this.length;
    }

    goTo(indexOrInstruction) {
      if (isString(indexOrInstruction)) {
        switch (indexOrInstruction) {
          case INDEXABLE_INSTRUCTIONS.NEXT:
            return this.goTo(this.nextIndex);
          case INDEXABLE_INSTRUCTIONS.PREVIOUS:
            return this.goTo(this.prevIndex);
          case INDEXABLE_INSTRUCTIONS.FIRST:
            return this.goTo(this.firstIndex);
          case INDEXABLE_INSTRUCTIONS.LAST:
            return this.goTo(this.lastIndex);
          case INDEXABLE_INSTRUCTIONS.RANDOM:
            // @TODO: eventually store previous indexes to avoid duplicates
            return this.goTo(randomInt(this.minIndex, this.maxIndex));
          default:
            this.$warn('Invalid goto instruction.');
            return Promise.reject();
        }
      }
      this.currentIndex = indexOrInstruction;
      return Promise.resolve();
    }

    goNext() {
      return this.goTo(this.nextIndex);
    }

    goPrev() {
      return this.goTo(this.prevIndex);
    }
  }

  // Add constants as static properties to the returned class
  const IndexableWithConstants = Indexable as any;
  IndexableWithConstants.MODES = INDEXABLE_MODES;
  IndexableWithConstants.INSTRUCTIONS = INDEXABLE_INSTRUCTIONS;

  return IndexableWithConstants;
}
