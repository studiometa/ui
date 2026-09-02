import type {
  BaseConfig,
  BaseConstructor,
  BaseProps,
  MixedClass,
  OptionDefinition,
} from '@studiometa/js-toolkit';
import { clamp } from '@studiometa/js-toolkit/utils/clamp';
import { fold } from '@studiometa/js-toolkit/utils/fold';
import { randomInt } from '@studiometa/js-toolkit/utils/randomInt';
import { wrap } from '@studiometa/js-toolkit/utils/wrap';

/** How the index behaves when a move would leave the `0…length - 1` range. */
export const INDEXABLE_BOUNDARIES = Object.freeze({
  CLAMP: 'clamp',
  LOOP: 'loop',
  BOUNCE: 'bounce',
} as const);

export type IndexableBoundary = (typeof INDEXABLE_BOUNDARIES)[keyof typeof INDEXABLE_BOUNDARIES];

/** The named moves `goTo()` accepts besides a number. */
export const INDEXABLE_INSTRUCTIONS = Object.freeze({
  NEXT: 'next',
  PREVIOUS: 'previous',
  FIRST: 'first',
  LAST: 'last',
  RANDOM: 'random',
} as const);

export type IndexableInstruction =
  (typeof INDEXABLE_INSTRUCTIONS)[keyof typeof INDEXABLE_INSTRUCTIONS];

const BOUNDARY_VALUES: readonly string[] = Object.values(INDEXABLE_BOUNDARIES);

/**
 * The options the mixin contributes to its host's config, typed rather than
 * inferred so the `as BaseConfig` below stays a widening and not a guess —
 * `TRANSITION_OPTIONS` plays exactly this role for `withTransition`.
 */
const INDEXABLE_OPTIONS: Record<string, OptionDefinition> = {
  boundary: {
    type: String,
    default: INDEXABLE_BOUNDARIES.CLAMP,
  },
  reverse: Boolean,
  total: {
    type: Number,
    default: 0,
  },
};

/** The option and event surface `withIndex` adds to its host. */
export type IndexableProps = BaseProps & {
  $options: {
    boundary: IndexableBoundary;
    reverse: boolean;
    total: number;
  };
  $emits: {
    index: { index: number };
  };
};

/** What the mixin adds to the class it is applied to. */
export interface IndexableInterface {
  /**
   * Index storage.
   * @private
   */
  __index: number;

  /**
   * The travel direction once a `bounce` boundary has flipped it, `null` while
   * the `reverse` option still answers.
   * @private
   */
  __isReverse: boolean | null;

  /**
   * The boundary once it has been assigned, `null` while the `boundary` option
   * still answers.
   * @private
   */
  __boundary: IndexableBoundary | null;

  /** Whether the index travels backwards. */
  get isReverse(): boolean;
  set isReverse(value: boolean);

  /** The boundary behaviour, falling back to `clamp` for an unknown value. */
  get boundary(): IndexableBoundary;
  set boundary(value: IndexableBoundary);

  /**
   * The number of indexes. Defaults to the `total` option, which lets the
   * mixin be used standalone; a host may override it to derive the length from
   * its content (e.g. the number of child items).
   */
  get length(): number;

  /** The lowest reachable index. */
  get minIndex(): number;

  /** The highest reachable index. */
  get maxIndex(): number;

  /** The current index. Assigning it normalizes and emits `index`. */
  get currentIndex(): number;
  set currentIndex(value: number);

  /** Where `first` goes, which depends on the travel direction. */
  get firstIndex(): number;

  /** Where `last` goes, which depends on the travel direction. */
  get lastIndex(): number;

  /** `1` going forward, `-1` reversed. */
  get direction(): number;

  /** The index one step back, already normalized. */
  get prevIndex(): number;

  /** The index one step forward, already normalized. */
  get nextIndex(): number;

  /** Bring any value into range, following the current boundary. */
  normalizeIndex(value: number): number;

  /** Wrap within `0…length`, or `0` when there is no length to wrap in. */
  loopIndex(value: number): number;

  /** Go to an index or follow a named instruction. */
  goTo(indexOrInstruction: number | IndexableInstruction): Promise<void>;

  /** Go one step forward. */
  goNext(): Promise<void>;

  /** Go one step back. */
  goPrev(): Promise<void>;

  /** One step, reflecting the travel direction at a bound with `bounce`. */
  step(direction: number): Promise<void>;
}

/**
 * Add a bounded, navigable current index to a component.
 *
 * The mixin is the primitive and {@link Indexable} is its declarative form —
 * `withIndex(Base)` and nothing else — which is the same split
 * `withTransition()`/`Transition` uses. Reach for the mixin when the component
 * already extends something else, for the class when it does not.
 *
 * Like `withTransition`, it is not built on `createServiceMixin()`: there is no
 * service and no subscription, only state. What it shares with those mixins is
 * the type shape — `MixedClass` — so a consumer threads its own props through
 * the same way: `class Gallery<T> extends withIndex(Base)<GalleryProps & T>`.
 *
 * **It declares no `name`**, only options, for the reason spelled out in
 * `withTransition`: a name here would be inherited by any consumer which
 * declared none, registering it under a name it never chose. `resolveConfig()`
 * merges each own `config` along the prototype chain, so the `boundary`,
 * `reverse` and `total` options reach a consumer that declares none of them.
 */
export interface IndexableMixin {
  <T extends BaseConstructor>(BaseClass: T): MixedClass<T, IndexableInterface>;
}

/**
 * Typed against concrete `BaseConstructor` rather than the public signature's
 * type parameter, and cast on the way out — the same split `withTransition`
 * and `createServiceMixin()` use, and for the same reason: TypeScript requires
 * a class extending a *type parameter* to declare `constructor(...args: any[])`,
 * which would add a constructor this mixin does not need.
 */
function applyIndex(BaseClass: BaseConstructor) {
  class WithIndex extends BaseClass {
    /**
     * The options the mixin reads, declared once here instead of by every
     * consumer, and without a `name` so the host keeps its identity.
     */
    static config = { options: { ...INDEXABLE_OPTIONS } } as BaseConfig;

    __index = 0;

    __isReverse: boolean | null = null;

    __boundary: IndexableBoundary | null = null;

    /**
     * The options this mixin reads.
     *
     * Through `unknown`, not a direct assertion: the host is a loose
     * `BaseConstructor`, so `$options` is `any` here and reading it straight
     * would hand back an unchecked value under type-aware linting.
     * @private
     */
    get __indexOptions(): IndexableProps['$options'] {
      const options: unknown = this.$options;
      return options as IndexableProps['$options'];
    }

    /**
     * v3 kept the travel direction and the boundary in `$options` and **wrote
     * to them**. `$options` is a read-only view over attributes in v4, so both
     * become private state seeded from the option — the same move
     * `AccordionItem.isOpen` had to make.
     */
    get isReverse(): boolean {
      return this.__isReverse ?? this.__indexOptions.reverse === true;
    }

    set isReverse(value: boolean) {
      this.__isReverse = Boolean(value);
    }

    get boundary(): IndexableBoundary {
      const boundary = this.__boundary ?? this.__indexOptions.boundary;
      return BOUNDARY_VALUES.includes(boundary) ? boundary : INDEXABLE_BOUNDARIES.CLAMP;
    }

    set boundary(value: IndexableBoundary) {
      this.__boundary = BOUNDARY_VALUES.includes(value) ? value : INDEXABLE_BOUNDARIES.CLAMP;
    }

    /** Defaults to the `total` option; hosts derive it from their content. */
    get length(): number {
      return this.__indexOptions.total;
    }

    get minIndex(): number {
      return 0;
    }

    get maxIndex(): number {
      return Math.max(this.length - 1, 0);
    }

    get currentIndex(): number {
      return this.__index;
    }

    set currentIndex(value: number) {
      const oldIndex = this.__index;
      this.__index = this.normalizeIndex(value);
      if (this.__index !== oldIndex) {
        this.$emit('index', { index: this.__index });
      }
    }

    get firstIndex(): number {
      return this.isReverse ? this.maxIndex : this.minIndex;
    }

    get lastIndex(): number {
      return this.isReverse ? this.minIndex : this.maxIndex;
    }

    /** `1` going forward, `-1` reversed. */
    get direction(): number {
      return this.isReverse ? -1 : 1;
    }

    get prevIndex(): number {
      return this.normalizeIndex(this.currentIndex - this.direction);
    }

    get nextIndex(): number {
      return this.normalizeIndex(this.currentIndex + this.direction);
    }

    /** Bring any value into range, following the current boundary. */
    normalizeIndex(value: number): number {
      switch (this.boundary) {
        case INDEXABLE_BOUNDARIES.BOUNCE:
          return fold(value, this.minIndex, this.maxIndex);
        case INDEXABLE_BOUNDARIES.LOOP:
          return this.loopIndex(value);
        default:
          return clamp(value, this.minIndex, this.maxIndex);
      }
    }

    /** Wrap within `0…length`, or `0` when there is no length to wrap in. */
    loopIndex(value: number): number {
      const { length } = this;

      if (!Number.isFinite(length) || length <= 0) {
        return 0;
      }

      return wrap(value, 0, length);
    }

    goTo(indexOrInstruction: number | IndexableInstruction): Promise<void> {
      if (typeof indexOrInstruction === 'string') {
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
            return this.goTo(randomInt(this.minIndex, this.maxIndex));
          default:
            this.$warn('indexable.invalid-instruction', 'Invalid goto instruction.');
            return Promise.resolve();
        }
      }

      if (!Number.isFinite(indexOrInstruction)) {
        this.$warn('indexable.invalid-index', 'Invalid goto index.');
        return Promise.resolve();
      }

      this.currentIndex = indexOrInstruction;
      return Promise.resolve();
    }

    goNext(): Promise<void> {
      return this.step(this.direction);
    }

    goPrev(): Promise<void> {
      return this.step(-this.direction);
    }

    /** One step, reflecting the travel direction at a bound with `bounce`. */
    step(direction: number): Promise<void> {
      if (this.boundary === INDEXABLE_BOUNDARIES.BOUNCE) {
        const tentative = this.currentIndex + direction;
        const reversed = tentative > this.maxIndex || tentative < this.minIndex;
        if (reversed) {
          this.isReverse = !this.isReverse;
        }
        return this.goTo(fold(tentative, this.minIndex, this.maxIndex));
      }
      return this.goTo(this.normalizeIndex(this.currentIndex + direction));
    }
  }

  return WithIndex;
}

export const withIndex = applyIndex as unknown as IndexableMixin;
