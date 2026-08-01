import type { Base, BaseConfig } from '@studiometa/js-toolkit';
import {
  createMemoryStorageProvider,
  createStorage,
  isNumber,
  nextFrame,
} from '@studiometa/js-toolkit/utils';
import type { IndexableInstructions, IndexableProps } from '../decorators/index.js';
import { Indexable } from '../Indexable/index.js';
import { AbstractCarouselChild } from './AbstractCarouselChild.js';
import { CarouselBtn } from './CarouselBtn.js';
import { CarouselDrag } from './CarouselDrag.js';
import { CarouselItem } from './CarouselItem.js';
import { CarouselWrapper } from './CarouselWrapper.js';

/**
 * Shape of the per-instance store shared with the child components.
 */
export type CarouselStore = { index: number };

/**
 * Props for the Carousel class.
 */
export interface CarouselProps {
  $children: {
    CarouselBtn: CarouselBtn[];
    CarouselDrag: CarouselDrag[];
    CarouselItem: CarouselItem[];
    CarouselWrapper: CarouselWrapper[];
  };
  $options: {
    axis: 'x' | 'y';
  };
}

/**
 * Carousel class.
 */
export class Carousel<T extends IndexableProps = IndexableProps> extends Indexable<T & CarouselProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Carousel',
    components: {
      CarouselBtn,
      CarouselDrag,
      CarouselItem,
      CarouselWrapper,
    },
    options: {
      ...Indexable.config.options,
      axis: { type: String, default: 'x' },
    },
    emits: ['progress'],
  };

  /**
   * Per-instance store used to broadcast the current index to the child
   * components. Controls subscribe to it through a guarded `$closest('Carousel')`
   * lookup instead of listening to `index`/`progress` events, which removes the
   * mount-order race where a child that mounted before the Carousel missed the
   * initial index.
   *
   * The store uses the in-memory provider and lives for the whole lifetime of
   * the instance (it is a constructor-time field). It survives `$destroy`/
   * `$mount` cycles of the same instance — a re-mounted Carousel exposes a
   * stale-but-consistent seeded index and its children re-subscribe on remount
   * and unsubscribe on destroy, so there is no leak and no need to `destroy()`
   * the memory store.
   */
  store = createStorage<CarouselStore>({ provider: createMemoryStorageProvider() });

  /**
   * Is the carousel horizontal?
   */
  get isHorizontal() {
    return !this.isVertical;
  }

  /**
   * Is the carousel vertical?
   */
  get isVertical() {
    return this.$options.axis === 'y';
  }

  /**
   * Get the carousel's items.
   */
  get items() {
    return this.$children.CarouselItem;
  }

  /**
   * Get the carousel's length.
   */
  get length() {
    return this.items?.length || 0;
  }

  /**
   * Get the carousel's wrapper.
   */
  get wrapper() {
    return this.$children.CarouselWrapper?.[0];
  }

  /**
   * Previous progress value.
   */
  previousProgress = -1;

  /**
   * Progress from 0 to 1.
   */
  get progress() {
    return this.wrapper?.progress ?? 0;
  }

  /**
   * Get the current index.
   *
   * The accessor pair is overridden as a whole: defining only the setter would
   * shadow the getter inherited from `withIndex` and make reads `undefined`.
   */
  get currentIndex(): number {
    return super.currentIndex;
  }

  /**
   * Set the current index and broadcast it to the child components.
   *
   * `super` runs first so `withIndex` normalises the value (clamp/loop/bounce)
   * and assigns `__index` before any subscriber reads `currentIndex`; the store
   * is then seeded with the normalised value, never the raw one. Assigning the
   * index only reports and stores state — it never scrolls the wrapper. Use
   * `goTo()` to navigate (which scrolls); this separation is what lets
   * `CarouselWrapper.onScroll` report the scroll-synced index without forming a
   * scroll/index feedback loop.
   *
   * The store write is gated on an actual change (or the store not being seeded
   * yet) so the initial `0 -> 0` assignment during `mounted` still seeds the
   * store, while same-value scroll updates do not re-run every subscriber. The
   * memory store fires subscribers synchronously with no deduplication, so this
   * gate is load-bearing.
   */
  set currentIndex(value: number) {
    super.currentIndex = value;
    const index = this.currentIndex;
    if (!this.store.has('index') || this.store.get('index') !== index) {
      this.store.set('index', index);
    }
  }

  /**
   * Mounted hook.
   *
   * Seeds the store with the current index (via `goTo`) then connects the
   * children — including any that mounted before this Carousel — so they
   * synchronise against an already-seeded store.
   */
  mounted() {
    this.goTo(this.currentIndex);
    this.connectChildren();
  }

  /**
   * Connect the child components that track the current index, including those
   * that mounted before this Carousel. Runs after `goTo` has seeded the store so
   * connected children synchronise against an initialised Carousel. Idempotent
   * thanks to the child-side `__unsubscribe` guard.
   */
  connectChildren() {
    for (const children of Object.values(this.$children as Record<string, Base[]>)) {
      for (const child of children) {
        if (child instanceof AbstractCarouselChild) {
          child.__connect(this as unknown as Carousel);
        }
      }
    }
  }

  /**
   * Re-normalise the index and reconnect children on update.
   *
   * Removing items after mount shrinks `length` but leaves `currentIndex`
   * untouched, so it can fall outside the new `0…lastIndex` range and leave no
   * item active. Reassigning it runs the `withIndex` setter, which re-normalises
   * against the current item count and re-seeds the store (a no-op when the
   * index is still in range). `connectChildren` then connects any newly-added
   * children — it is idempotent for already-connected ones thanks to the
   * `__unsubscribe` guard.
   */
  updated() {
    const { currentIndex } = this;
    this.currentIndex = currentIndex;
    this.connectChildren();
    // Item changes alter the progress denominator (the children invalidate their
    // geometry caches in their own `updated` hooks). Force `ticked` to re-emit
    // the refreshed progress on the next frame, otherwise the emitted `progress`
    // value and `--carousel-progress` stay stale until the next scroll.
    this.previousProgress = -1;
    this.$services.enable('ticked');
  }

  /**
   * Resized hook.
   *
   * Re-snaps to the current index. `goTo` scrolls imperatively, reading each
   * item's freshly-measured `state`, so the re-snap must run only after the
   * children have invalidated their geometry caches (`CarouselItem.state` and
   * `CarouselWrapper`'s scroll distance). js-toolkit dispatches resize callbacks
   * in mount (registration) order — the parent Carousel registers *before* its
   * children — so a synchronous re-snap here would read stale pre-resize
   * geometry. Deferring by one frame lets the children's `resized` callbacks
   * (which run synchronously later in the same resize tick) invalidate their
   * caches first, mirroring how `Slider.resized` defers with `nextFrame`.
   */
  resized() {
    nextFrame(() => this.goTo(this.currentIndex));
  }

  /**
   * Go to the given item.
   *
   * Navigation is imperative: after updating the index it scrolls the wrapper to
   * the matching item. The scroll is triggered only for numeric arguments —
   * instruction arguments (`next`, `prev`, …) recurse through `goNext`/`goPrev`
   * into a numeric `goTo`, which owns the scroll, so guarding on `isNumber`
   * avoids scrolling twice per instruction navigation.
   */
  goTo(indexOrInstruction: number | IndexableInstructions) {
    this.$log('goTo', indexOrInstruction);
    this.$services.enable('ticked');
    const result = super.goTo(indexOrInstruction);
    if (isNumber(indexOrInstruction)) {
      this.wrapper?.scrollToIndex(this.currentIndex);
    }
    return result;
  }

  ticked() {
    if (this.progress !== this.previousProgress) {
      this.previousProgress = this.progress;
      this.$emit('progress', this.progress);
      this.$el.style.setProperty('--carousel-progress', String(this.progress));
    } else {
      this.$services.disable('ticked');
    }
  }
}

export default Carousel;
