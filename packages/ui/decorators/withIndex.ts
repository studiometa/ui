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

export interface IndexableConstructor {
  MODES: typeof INDEXABLE_MODES;
  INSTRUCTIONS: typeof INDEXABLE_INSTRUCTIONS;
  new (): IndexableInterface;
}

/**
 * Extend a class to add index management.
 */
export function withIndex<S extends Base>(
  BaseClass: typeof Base,
): BaseDecorator<IndexableInterface, S, IndexableProps> {
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

    static MODES = INDEXABLE_MODES;

    static INSTRUCTIONS = INDEXABLE_INSTRUCTIONS;

    __index = 0;

    get isReverse() {
      return this.$options.reverse === true;
    }

    set isReverse(value) {
      this.$options.reverse = !!value;
    }

    get mode() {
      return Indexable.MODES[this.$options.mode.toUpperCase()] ?? Indexable.MODES.NORMAL;
    }

    set mode(value) {
      this.$options.mode = Indexable.MODES[value.toUpperCase()] ?? Indexable.MODES.NORMAL;
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
      switch (this.mode) {
        case Indexable.MODES.ALTERNATE:
          if (Math.floor(value/this.length) % 2 !== 0) {
            this.isReverse = !this.isReverse;
          }
          const cycleLength = this.length * 2;
          const cycleIndex = Math.abs(value) % cycleLength;
          this.__index = Math.min(cycleIndex, cycleLength - cycleIndex);
          break;
        case Indexable.MODES.INFINITE:
          this.__index = (value + this.length) % this.length
          break;
        case Indexable.MODES.NORMAL:
        default:
          this.__index = clamp(value, this.minIndex, this.maxIndex);
          break;
      }
      this.$emit('index', this.currentIndex);
    }

    get firstIndex() {
      return this.isReverse ? this.maxIndex : this.minIndex;
    }

    get lastIndex() {
      return this.isReverse ? this.minIndex : this.maxIndex;
    }

    get prevIndex() {
      let rawIndex = this.isReverse ? this.currentIndex + 1 : this.currentIndex - 1;
      if (this.mode === Indexable.MODES.ALTERNATE && (rawIndex > this.maxIndex || rawIndex < this.minIndex)) {
        this.isReverse = !this.isReverse;
        rawIndex = this.isReverse ? this.currentIndex + 1 : this.currentIndex - 1;
      }
      return this.mode === Indexable.MODES.NORMAL ? clamp(rawIndex, this.minIndex, this.maxIndex) : (rawIndex + this.length) % this.length;
    }

    get nextIndex() {
      let rawIndex = this.isReverse ? this.currentIndex - 1 : this.currentIndex + 1;
      if (this.mode === Indexable.MODES.ALTERNATE && (rawIndex > this.maxIndex || rawIndex < this.minIndex)) {
        this.isReverse = !this.isReverse;
        rawIndex = this.isReverse ? this.currentIndex - 1 : this.currentIndex + 1;
      }
      return this.mode === Indexable.MODES.NORMAL ? clamp(rawIndex, this.minIndex, this.maxIndex) : (rawIndex + this.length) % this.length;
    }

    goTo(indexOrInstruction) {
      if (isString(indexOrInstruction)) {
        switch (indexOrInstruction) {
          case Indexable.INSTRUCTIONS.NEXT:
            return this.goTo(this.nextIndex);
          case Indexable.INSTRUCTIONS.PREVIOUS:
            return this.goTo(this.prevIndex);
          case Indexable.INSTRUCTIONS.FIRST:
            return this.goTo(this.firstIndex);
          case Indexable.INSTRUCTIONS.LAST:
            return this.goTo(this.lastIndex);
          case Indexable.INSTRUCTIONS.RANDOM:
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

  // @ts-ignore
  return Indexable;
}
