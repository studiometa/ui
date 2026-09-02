import { nextFrame } from '@studiometa/js-toolkit/nextFrame';
import { signal } from '@studiometa/js-toolkit/signal';
import { withRaf } from '@studiometa/js-toolkit/withRaf';
import { withResize } from '@studiometa/js-toolkit/withResize';
import type {
  BaseConfig,
  ChildrenCollection,
  MountedReturn,
  RafRender,
} from '@studiometa/js-toolkit';
import { SCROLL_AXES } from '@studiometa/js-toolkit/utils/SCROLL_AXES';
import { scrollPosition } from '@studiometa/js-toolkit/utils/scrollPosition';
import { CarouselBtn } from './CarouselBtn.js';
import { CarouselCount } from './CarouselCount.js';
import { CarouselDots } from './CarouselDots.js';
import { CarouselDrag } from './CarouselDrag.js';
import { CarouselItem } from './CarouselItem.js';
import { CarouselPlay } from './CarouselPlay.js';
import { CarouselProgress } from './CarouselProgress.js';
import { CarouselThumbnails } from './CarouselThumbnails.js';
import { CarouselWrapper } from './CarouselWrapper.js';
import { CarouselContext, type CarouselApi, type CarouselState } from './context.js';
import {
  Indexable,
  type IndexableInstruction,
  type IndexableProps,
} from '../Indexable/Indexable.js';
import { snapAlignment, type ScrollPosition } from './utils.js';

export type CarouselProps = IndexableProps & {
  $options: IndexableProps['$options'] & {
    axis: 'x' | 'y';
    slideLabel: string;
  };
  $emits: IndexableProps['$emits'] & {
    progress: { progress: number };
  };
};

/**
 * The fallback accessible name of a slide, with the two placeholders the
 * `slide-label` option substitutes.
 *
 * English, and replaceable through the option, because a generated name is the
 * one string this component puts in front of a screen reader. `{index}` is
 * one-based — "1 of 4", not "0 of 4" — since it is read aloud, not indexed
 * with.
 */
const DEFAULT_SLIDE_LABEL = '{index} of {total}';

/**
 * The coordinator: a scroll-snapping carousel with live slides, navigation
 * buttons, an optional drag track and a published progress value.
 *
 * The shape is the one the `Slider` port arrived at. State and commands travel
 * on one provided object, so no control imports this class; the slides and the
 * wrapper are live `$watchChildren` collections, so adding or removing a slide
 * needs no `$update()`; and the geometry lives here, because this is the only
 * place that knows both the scroller and the item list.
 */
export class Carousel extends withResize(withRaf(Indexable, { manual: true }))<CarouselProps> {
  static config: BaseConfig = {
    name: 'Carousel',
    components: {
      CarouselBtn,
      CarouselCount,
      CarouselDots,
      CarouselDrag,
      CarouselItem,
      CarouselPlay,
      CarouselProgress,
      CarouselThumbnails,
      CarouselWrapper,
    },
    options: {
      axis: { type: String, default: 'x' },
      slideLabel: { type: String, default: DEFAULT_SLIDE_LABEL },
    },
  };

  state = signal<CarouselState>({
    index: 0,
    total: 0,
    prevIndex: 0,
    nextIndex: 0,
    isHorizontal: true,
  });

  /**
   * The scroll-derived progress, republished from the frame hook.
   *
   * Declared before `api`, which reads it: class fields initialise in source
   * order, so a signal declared after the provider would be `undefined` on the
   * object every control receives.
   */
  scrollProgress = signal(0);

  /**
   * The exposed surface. Provided from a field initializer, so it answers a
   * child's `$injectSync` from the moment the instance exists — which is what
   * replaces v3's `connectChildren()` handshake entirely.
   */
  api: CarouselApi = this.$provide(CarouselContext, {
    state: this.state,
    progress: this.scrollProgress,
    el: this.$el,
    slideLabel: (index, total) => this.slideLabel(index, total),
    goTo: (indexOrInstruction) => {
      void this.goTo(indexOrInstruction);
    },
    goNext: () => {
      void this.goNext();
    },
    goPrev: () => {
      void this.goPrev();
    },
    indexOf: (element) => this.items.items.findIndex((item) => item.$el === element),
    positions: () => this.positions,
    reportIndex: (index) => {
      this.currentIndex = index;
    },
    keepTicking: () => {
      this.$services.ticked.start();
    },
  });

  items: ChildrenCollection<CarouselItem> = this.$watchChildren(CarouselItem, {
    added: () => this.itemsChanged(),
    removed: () => this.itemsChanged(),
  });

  wrappers: ChildrenCollection<CarouselWrapper> = this.$watchChildren(CarouselWrapper, {
    added: () => this.wrappersChanged(),
    removed: () => this.wrappersChanged(),
  });

  previousProgress = -1;

  /**
   * The scroll offset of every slide, at the alignment its own
   * `scroll-snap-align` asks for, measured once per change.
   */
  __positions: ScrollPosition[] | null = null;

  /**
   * The observer deciding which slides are presented.
   * @private
   */
  __presenceObserver: IntersectionObserver | null = null;

  /**
   * The scroller the current observer was built against. An
   * `IntersectionObserver` bakes its root in at construction, so a wrapper
   * arriving or leaving means a new observer rather than a new `observe()`.
   * @private
   */
  __presenceRoot: HTMLElement | null = null;

  get isHorizontal(): boolean {
    return !this.isVertical;
  }

  get isVertical(): boolean {
    return this.$options.axis === 'y';
  }

  /** The slide count, which is what `Indexable` normalises against. */
  get length(): number {
    return this.items.size;
  }

  get wrapper(): CarouselWrapper | undefined {
    return this.wrappers.items[0];
  }

  get progress(): number {
    return this.wrapper?.progress ?? 0;
  }

  get positions(): ScrollPosition[] {
    const scroller = this.wrapper?.$el;

    if (!scroller) {
      return [];
    }

    // Per item, not once for the track: `scroll-snap-align` is declared on the
    // slide, so a carousel is free to align one slide differently from the
    // next, and reading it here costs nothing the layout read did not already.
    this.__positions ??= this.items.items.map((item) =>
      scrollPosition(item.$el, {
        rootElement: scroller,
        axis: SCROLL_AXES.both,
        align: snapAlignment(item.$el),
      }),
    );

    return this.__positions;
  }

  get currentIndex(): number {
    return super.currentIndex;
  }

  /**
   * Set the index and publish it.
   *
   * `super` runs first so the boundary normalisation lands before anything
   * reads the value back. Assigning the index only reports state — it never
   * scrolls the wrapper. That separation is what lets `onScroll` report the
   * scroll-synced index without forming a scroll/index feedback loop.
   */
  set currentIndex(value: number) {
    super.currentIndex = value;
    this.publish();
  }

  mounted(): MountedReturn {
    this.__initializeAccessibility();
    void this.goTo(this.currentIndex);
    this.publish();
    this.syncPresence();
    this.wrapper?.syncAccessibility();
    return [
      super.mounted(),
      () => {
        this.__positions = null;
        this.previousProgress = -1;
        this.__presenceObserver?.disconnect();
        this.__presenceObserver = null;
        this.__presenceRoot = null;
        for (const item of this.items.items) {
          item.$el.inert = false;
        }
      },
    ];
  }

  /**
   * Re-measure and re-snap after a viewport change.
   *
   * v3 defers by one frame so the children invalidate their own geometry
   * caches first — they each held one, and the parent's resize callback ran
   * before theirs. There is one cache now and it belongs here, so the frame is
   * only still needed for the layout the resize itself is about to produce.
   */
  resized(): void {
    this.__positions = null;
    this.wrapper?.invalidate();
    void nextFrame().then(() => {
      if (this.$isMounted) {
        void this.goTo(this.currentIndex);
      }
    });
  }

  /**
   * A slide arrived or left.
   *
   * v3 does this from `updated()`, which a consumer had to call. Re-assigning
   * the index re-normalises it against the new count — removing slides can
   * leave `currentIndex` past the end with no slide active — and the progress
   * denominator changed, so the loop is restarted to republish it.
   */
  itemsChanged(): void {
    this.__positions = null;
    this.wrapper?.invalidate();
    // Re-run the setter so the boundary re-normalises against the new count.
    // oxlint-disable-next-line no-self-assign
    this.currentIndex = this.currentIndex;
    this.previousProgress = -1;
    this.$services.ticked.start();
    this.syncPresence();
    this.wrapper?.syncAccessibility();
  }

  /**
   * The scroll track arrived or left.
   *
   * The presence observer is built against the track, and the track's own
   * focusability and scroll padding are measured from it, so both are
   * meaningless until there is one and both have to be redone if it is
   * replaced.
   */
  wrappersChanged(): void {
    this.__positions = null;
    this.syncPresence();
    this.wrapper?.syncAccessibility();
  }

  /**
   * Rebuild the observer that decides which slides are presented.
   *
   * The set is computed as **everything not intersecting the scroller**, not
   * "everything but the snapped one". Those are the same list only in a
   * one-slide-at-a-time layout: under a peek or a multi-slide track the second
   * rule hides slides the user can see, which is the defect Embla's own v9
   * accessibility plugin shipped.
   *
   * The observer is rebuilt rather than incrementally updated because the
   * cheap operation happens on a structural change — a slide added or removed,
   * a track replaced — and re-observing re-delivers an entry per target, which
   * is what re-establishes the state after the disconnect.
   */
  syncPresence(): void {
    const root = this.wrapper?.$el ?? null;

    if (root !== this.__presenceRoot) {
      this.__presenceObserver?.disconnect();
      this.__presenceObserver = root
        ? new IntersectionObserver((entries) => this.__presented(entries), {
            root,
            threshold: 0,
            // Measured in Chromium 151: an element whose box only *touches*
            // the root edge reports `isIntersecting: true` with an
            // `intersectionRatio` of `0` — and touching edges is exactly how
            // adjacent slides sit in a snap track, so every slide would read
            // as presented. Shrinking the root by a pixel turns the touch
            // into a miss and makes the boolean mean what it says. Reading
            // the ratio instead would not do: the observer only fires when a
            // threshold is crossed, and a slide going from a zero-area touch
            // to half visible crosses none.
            rootMargin: '-1px',
          })
        : null;
      this.__presenceRoot = root;
    }

    const observer = this.__presenceObserver;

    if (!observer) {
      return;
    }

    observer.disconnect();

    for (const item of this.items.items) {
      observer.observe(item.$el);
    }
  }

  /**
   * Take the slides that left the scroller out of the tab order.
   *
   * `inert` and not `aria-hidden`: measured in Chromium 151 and Firefox 153,
   * `aria-hidden` leaves an element fully tabbable, so a screen reader user
   * lands on a control that has no name and no context. `inert` removes the
   * subtree from both the tab order and the accessibility tree in both
   * engines.
   *
   * A slide holding the focused element is left alone. Making it inert would
   * blow the focus back to `<body>` mid-interaction — a worse failure than the
   * one this method exists to fix — and it cannot happen for a slide the user
   * has not already reached, which is the case the contract is about.
   * @private
   */
  __presented(entries: IntersectionObserverEntry[]): void {
    this.$write(() => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        const shouldBeInert = !entry.isIntersecting;

        if (shouldBeInert && element.contains(document.activeElement)) {
          continue;
        }

        element.inert = shouldBeInert;
      }
    });
  }

  /** The accessible name of the slide at `index`, one-based when read aloud. */
  slideLabel(index: number, total: number): string {
    return this.$options.slideLabel
      .replaceAll('{index}', String(index + 1))
      .replaceAll('{total}', String(total));
  }

  /**
   * Give the carousel a role, and check it has a name.
   *
   * The role comes first because Chrome silently drops
   * `aria-roledescription` from a role-less `<div>`, so an author writing one
   * on the root gets nothing unless this has run.
   *
   * **`group` and not `region`.** Both satisfy the APG. `region` is a
   * landmark, and an unnamed one is dropped from the landmark list anyway,
   * so the only thing it buys over `group` is an entry in the screen reader's
   * landmark menu — which is the right trade for a page's main content and
   * the wrong one for the four product carousels a listing page ships. An
   * author who wants the landmark writes `role="region"` and keeps it: the
   * role is only ever written when the element has none.
   *
   * **No `aria-roledescription`.** v1's `Slider` emitted the English string
   * `carousel` unconditionally. It is not translated by anything — not the
   * browser, not the screen reader — and NVDA spells an unknown word out
   * letter by letter in a German locale, so the untranslated string is worse
   * than none. Chrome's own reference gallery omits it for the same reason.
   * An author who wants it writes it in their own language, and this method
   * has already given it the role it needs to be honoured.
   * @private
   */
  __initializeAccessibility(): void {
    if (!this.$el.hasAttribute('role')) {
      this.$el.setAttribute('role', 'group');
    }

    if (!this.$el.hasAttribute('aria-label') && !this.$el.hasAttribute('aria-labelledby')) {
      this.$warn(
        'carousel.unnamed',
        'The carousel needs an `aria-label` or an `aria-labelledby`. Without one it is an unnamed group a screen reader cannot tell from any other.',
      );
    }
  }

  goTo(indexOrInstruction: number | IndexableInstruction): Promise<void> {
    this.$services.ticked.start();
    const result = super.goTo(indexOrInstruction);
    // Instructions recurse into a numeric `goTo`, which owns the scroll, so
    // guarding here avoids scrolling twice per instruction.
    if (typeof indexOrInstruction === 'number') {
      this.wrapper?.scrollToIndex(this.currentIndex);
    }
    return result;
  }

  /**
   * The frame hook runs in the scheduler's **read** phase, which is where
   * `progress` belongs — it reads the wrapper's `scrollLeft`. The custom
   * property is a write, so it travels back as the returned render, which the
   * frame service runs in the write phase of the same frame.
   */
  ticked(): void | RafRender {
    const { progress } = this;

    if (progress === this.previousProgress) {
      this.$services.ticked.stop();
      return;
    }

    this.previousProgress = progress;
    this.scrollProgress.value = progress;
    this.$emit('progress', { progress });

    return () => {
      this.$el.style.setProperty('--carousel-progress', String(progress));
    };
  }

  /** Publish the whole state, so a control never has to ask for a second value. */
  publish(): void {
    this.state.value = {
      index: this.currentIndex,
      total: this.length,
      prevIndex: this.prevIndex,
      nextIndex: this.nextIndex,
      isHorizontal: this.isHorizontal,
    };
  }
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/Carousel`) has always exposed it. Family members
 * and sub-components carry only their named export.
 */
export default Carousel;
