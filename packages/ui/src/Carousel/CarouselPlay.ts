import { usePrefersReducedMotion } from '@studiometa/js-toolkit/usePrefersReducedMotion';
import type { BaseConfig, BaseProps, MountedReturn } from '@studiometa/js-toolkit';
import { TimerProgress, type TimerProgressProps } from '../Timer/TimerProgress.js';
import { INDEXABLE_INSTRUCTIONS } from '../Indexable/Indexable.js';
import { CarouselContext, type CarouselApi } from './context.js';

export type CarouselPlayProps = TimerProgressProps & {
  $el: HTMLButtonElement;
  $refs: {
    /** Optional element carrying the visible label, kept in sync with the state. */
    label: HTMLElement;
  };
  $options: TimerProgressProps['$options'] & {
    /** The accessible name while the rotation is stopped. */
    labelStart: string;
    /** The accessible name while the rotation is running. */
    labelStop: string;
  };
};

/**
 * What counts as a tab stop, for the first-focusable-element check.
 *
 * Approximate on purpose: it drives a development warning, never behaviour,
 * and the exact answer needs layout — `display: none` and `visibility: hidden`
 * remove an element from the tab order and no selector can see either.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'details',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex^="-"])',
].join(',');

/**
 * The rotation control of an auto-rotating carousel: a button that advances
 * the carousel on a timer and lets the user stop it.
 *
 * **It is a component, and it is off by default.** A carousel rotates only
 * where this element is in the markup, because unrequested motion is the
 * single largest source of WCAG Level A exposure in the whole set — SC 2.2.2
 * *Pause, Stop, Hide* is failed by any automatic movement lasting more than
 * five seconds that the user cannot stop.
 *
 * **The timing is not written here.** `CarouselPlay` extends
 * {@link TimerProgress}, so the countdown, `delay`, `repeat`, `autostart`,
 * `pause()`/`resume()` preserving elapsed time, the six `timer-*` events and
 * the per-frame `timer-progress` ratio all come from the `Timer` primitives
 * unchanged. The rotation itself is one line: `timer-end` advances the
 * carousel. What this class adds is everything a countdown must not know
 * about:
 *
 * - **Its accessible name flips** between `labelStart` and `labelStop`, on a
 *   `label` ref when there is one and on `aria-label` when there is not. It
 *   carries **no `aria-pressed`**: a control whose name already says what it
 *   will do is a plain button, and a toggle name paired with a toggle state
 *   is announced twice and contradicts itself half the time.
 * - **Hover and focus stop it, and nothing restarts it.** A user who tabs
 *   through the carousel and out the other side must not have the slides move
 *   under them on the way out, so `resume()` is left to the consumer and the
 *   button restarts from zero.
 * - **`prefers-reduced-motion` suppresses the automatic start**, observed
 *   through a live subscription rather than sampled once at mount — the APG's
 *   own carousel examples read the query at load and never look again, so
 *   they keep rotating for a user who turns the setting on. Turning it on
 *   stops a rotation in flight. Pressing the button is an explicit request and
 *   still works.
 * - **Activating it never moves focus.** Advancing the carousel scrolls its
 *   track and nothing else, so the button stays focused.
 *
 * The control must be the **first focusable element inside the carousel**, so
 * that a keyboard or screen-reader user meets the stop button before the
 * moving content. That is markup, not behaviour, so it is checked and warned
 * about rather than enforced.
 *
 * ::: warning
 * Turning the automatic start off is `data-option-no-autostart`.
 * A boolean option is true when its attribute is present, so
 * `data-option-autostart="false"` reads as **true**.
 * :::
 *
 * @link https://ui.studiometa.dev/reference/items/Carousel/js-api#carouselplay
 */
export class CarouselPlay<T extends BaseProps = BaseProps> extends TimerProgress<
  CarouselPlayProps & T
> {
  static config: BaseConfig = {
    name: 'CarouselPlay',
    refs: ['label'],
    options: {
      // Both differ from the `Timer` defaults, which are a countdown's and not
      // a carousel's: a rotation with no repeat moves once, and a five-second
      // dwell is the shortest interval SC 2.2.2 does not immediately fail.
      delay: { type: Number, default: 5 },
      repeat: { type: Boolean, default: true },
      labelStart: { type: String, default: 'Start automatic slide show' },
      labelStop: { type: String, default: 'Stop automatic slide show' },
    },
  };

  /**
   * The carousel this control drives, resolved once per mount cycle.
   *
   * The same two lines `AbstractCarouselComponent` has, rather than that class:
   * this one already extends `TimerProgress`, and a mixin for one memoised
   * `$injectSync()` would be more machinery than the thing it hides.
   * @private
   */
  __carousel: CarouselApi | undefined;

  /** @private */
  __reducedMotion = false;

  /** The carousel this control belongs to, or `undefined` outside one. */
  get carousel(): CarouselApi | undefined {
    return (this.__carousel ??= this.$injectSync(CarouselContext));
  }

  /** Whether a rotation is currently counting down. */
  get isPlaying(): boolean {
    return this.timerId !== null;
  }

  /**
   * Watch the carousel for interaction and start rotating, unless the user
   * asked for less motion or the markup asked for no automatic start.
   *
   * `Timer.mounted()` is deliberately not called: its whole body is the
   * autostart branch and the teardown, and the reduced-motion decision belongs
   * inside that branch.
   */
  mounted(): MountedReturn {
    // The whole carousel, so that reading a slide stops the rotation and not
    // only touching the button. It falls back to the button outside a carousel,
    // where the control has nothing to drive anyway.
    const region = this.$closest('Carousel')?.$el ?? this.$el;
    const pause = () => this.pause();

    // `pointerenter` rather than `pointerover`: it fires once for the region,
    // not once per element crossed inside it.
    region.addEventListener('pointerenter', pause);
    region.addEventListener('focusin', pause);

    const unwatchMotion = usePrefersReducedMotion().subscribe(
      ({ matches }) => this.__reducedMotionChanged(matches),
      { immediate: true },
    );

    this.__warnAboutTabOrder(region);
    this.__syncLabel();

    if (this.$options.autostart && !this.__reducedMotion) {
      this.start();
    }

    return () => {
      region.removeEventListener('pointerenter', pause);
      region.removeEventListener('focusin', pause);
      unwatchMotion();
      this.clear();
      this.__carousel = undefined;
    };
  }

  /** Toggle the rotation, from the keyboard or the pointer. */
  onClick(): void {
    if (this.isPlaying) {
      this.stop();
    } else {
      // Restarting rather than resuming: a rotation resumed with 200ms left
      // moves the moment the user presses the button they pressed to control
      // it. `resume()` is still there for a consumer who wants the other one.
      this.start();
    }
  }

  /**
   * Advance the carousel, wrapping to the first slide at the end.
   *
   * The wrap is the component's own, not the `boundary` option's: `clamp` is
   * the default and it is the right answer for the arrow buttons, which should
   * disable at the ends — while a rotation that stops at the last slide and
   * leaves a running "Stop" button behind is not a rotation at all.
   */
  rotate(): void {
    const { carousel } = this;

    if (!carousel) {
      return;
    }

    const { index, nextIndex } = carousel.state.value;

    if (nextIndex === index) {
      carousel.goTo(INDEXABLE_INSTRUCTIONS.FIRST);
    } else {
      carousel.goNext();
    }
  }

  /**
   * Stop a rotation the user has just asked not to see.
   *
   * Called on every change of the media query and once with its current value,
   * so the setting is honoured whenever it is turned on — at load, from the OS
   * while the page is open, or from the browser's own emulation.
   */
  __reducedMotionChanged(matches: boolean): void {
    this.__reducedMotion = matches;

    if (matches && (this.isPlaying || this.paused)) {
      this.stop();
    }
  }

  /** Start the countdown and say so. */
  start(): void {
    super.start();
    this.__syncLabel();
  }

  /** Stop the countdown and say so. */
  stop(): void {
    super.stop();
    this.__syncLabel();
  }

  /** Pause the countdown and say so. */
  pause(): void {
    super.pause();
    this.__syncLabel();
  }

  /** Resume the countdown and say so. */
  resume(): void {
    super.resume();
    this.__syncLabel();
  }

  /** Advance the carousel when the countdown reaches zero. */
  complete(): void {
    // `super` first: with `repeat` on it re-arms the countdown, so the next
    // interval starts timing while the slide is still travelling rather than
    // after it lands.
    super.complete();
    this.rotate();
  }

  /**
   * Name the control after what pressing it will do.
   * @private
   */
  __syncLabel(): void {
    const { labelStart, labelStop } = this.$options;
    const label = this.isPlaying ? labelStop : labelStart;
    const target = this.$refs.label;

    if (target) {
      // Writing the visible text keeps the accessible name and the label a
      // sighted user reads identical, which `aria-label` on a button with text
      // would break (WCAG SC 2.5.3, Label in Name).
      target.textContent = label;
    } else {
      this.$el.setAttribute('aria-label', label);
    }
  }

  /**
   * Warn when the control is not the first thing a keyboard user reaches.
   * @private
   */
  __warnAboutTabOrder(region: HTMLElement): void {
    if (region === this.$el) {
      return;
    }

    if (region.querySelector(FOCUSABLE_SELECTOR) !== this.$el) {
      this.$warn(
        'carousel-play.not-first-focusable',
        'The rotation control should be the first focusable element inside the carousel, so a keyboard or screen reader user can stop the movement before reaching it.',
      );
    }
  }
}
