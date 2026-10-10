import { Base } from '@studiometa/js-toolkit/Base';
import { withInView } from '@studiometa/js-toolkit/withInView';
import { withRaf } from '@studiometa/js-toolkit/withRaf';
import type {
  BaseConfig,
  BaseProps,
  InViewProps,
  MountedReturn,
  RafRender,
} from '@studiometa/js-toolkit';
import { clamp } from '@studiometa/js-toolkit/utils/clamp';
import type { Transitionable } from '../decorators/withTransition.js';
import type { Dialog } from '../Dialog/Dialog.js';
import { scrollBehavior } from '../utils/scroll-behavior.js';

export interface SheetProps extends BaseProps {
  $refs: {
    /** The sheet itself: what slides in, and what the timeline tracks. */
    panel: HTMLElement;
  };
  $options: {
    /**
     * The viewport edge the sheet is attached to. Only `bottom` is
     * implemented; the option exists so the other edges can be added without
     * changing the markup of a bottom sheet.
     */
    position: 'bottom';
  };
}

/**
 * The view timeline the panel declares. It is the name author CSS animates
 * against, so it is a published contract rather than an implementation
 * detail.
 */
const TIMELINE = '--sheet';

/**
 * The fallback for browsers without view timelines: the same progress, as a
 * custom property on the root element.
 */
const PROGRESS_PROPERTY = '--sheet-progress';

/**
 * How long a programmatic scroll may hold `enter()` or `leave()` when no
 * `scrollend` arrives. Every engine measured finishes a viewport-high smooth
 * scroll well within it, so in practice it only covers a browser without the
 * event, or a scroll the browser dropped — a `Dialog` must never be left
 * waiting on a close that cannot finish.
 */
const SETTLE_TIMEOUT = 1000;

/**
 * The top of an element's layout box, summed along its `offsetParent` chain.
 *
 * Layout offsets ignore transforms, as a view timeline does: a panel scaled by
 * the very progress it publishes would otherwise move the value it is
 * animated from.
 */
function layoutTop(element: HTMLElement): number {
  let top = 0;
  for (let node: Element | null = element; node instanceof HTMLElement; node = node.offsetParent) {
    top += node.offsetTop;
  }
  return top;
}

/**
 * A swipeable sheet whose gesture is native scrolling.
 *
 * The root element is a scroller twice the height of the viewport, of which
 * only the top half is visible. The panel lives in its bottom half, in a
 * viewport-sized stage, and scroll snap points at either end make every
 * gesture settle fully open or fully closed. Opening is a scroll to the end,
 * closing a scroll back to `0`, and a swipe is the user doing the same scroll
 * by hand — with the platform's momentum, elasticity and refresh rate, and no
 * touch handling here.
 *
 * It is not an overlay of its own. It is a `Transitionable` child of `Dialog`,
 * which awaits `enter()` on open and `leave()` on close like any other
 * transition, and keeps everything the `<dialog>` element provides: the top
 * layer, focus, `inert` and <kbd>Esc</kbd>.
 *
 * What it adds on top of the scroll:
 *
 * - **Swipe to dismiss.** An `IntersectionObserver` sees the panel leave the
 *   viewport after it was seen on screen, and closes the parent `Dialog`. The
 *   `leave()` that close runs then resolves at once: the panel is already
 *   gone, so there is nothing left to animate.
 * - **A timeline to animate against.** The panel declares a `--sheet` view
 *   timeline, scoped to the root so the backdrop can use it too. Where view
 *   timelines are not supported, the same progress is published as
 *   `--sheet-progress`.
 *
 * @link https://ui.studiometa.dev/reference/items/Sheet/
 */
export class Sheet<T extends BaseProps = BaseProps>
  extends withRaf(
    withInView(Base, {
      threshold: [0, 1],
      // The mixin is applied before this class exists, so the resolver names
      // the shape it needs rather than the class.
      target: (instance) => (instance as Base & { readonly panel: HTMLElement }).panel,
    }),
    { manual: true },
  )<SheetProps & T>
  implements Transitionable
{
  static config: BaseConfig = {
    name: 'Sheet',
    refs: ['panel'],
    options: {
      position: { type: String, default: 'bottom' },
    },
  };

  state: 'entering' | 'leaving' | null = null;

  /**
   * Whether the panel has been on screen since the sheet last left.
   *
   * A panel out of view only means "swiped away" once it has been seen: it is
   * out of view on every open, until `enter()` has scrolled it in, and the
   * observer's first report arrives in that window.
   * @private
   */
  __hasEntered = false;

  /**
   * Settles the programmatic scroll in flight, or `null` when there is none.
   * A newer scroll settles the older one first, so a close started during the
   * opening scroll releases `open()` instead of leaving it pending.
   * @private
   */
  __settle: (() => void) | null = null;

  /**
   * Whether this browser needs `--sheet-progress`, decided once per mount.
   * @private
   */
  __publishesProgress = false;

  /** @private */
  __previousProgress = -1;

  /** The sheet itself. */
  get panel(): HTMLElement {
    return this.$refs.panel;
  }

  /**
   * How far the panel has entered the visible half of the scroller, from `0`
   * (out of view) to `1` (fully in view).
   *
   * It is what the `entry` range of the `--sheet` view timeline measures, so
   * `--sheet-progress` drives the same keyframes as `animation-range: entry`.
   */
  get progress(): number {
    const { $el, panel } = this;
    const size = panel.offsetHeight;

    if (size === 0) {
      return 0;
    }

    const start = layoutTop(panel) - layoutTop($el);
    const visibleEnd = $el.scrollTop + $el.clientHeight / 2;

    return clamp((visibleEnd - start) / size, 0, 1);
  }

  mounted(): MountedReturn {
    const { $el, panel } = this;

    if (this.$options.position !== 'bottom') {
      this.$warn(
        'sheet.unsupported-position',
        `The \`${this.$options.position}\` position is not implemented: the sheet behaves as a \`bottom\` sheet.`,
      );
    }

    // The timeline insets its end by the hidden bottom half of the scroller,
    // so it tracks what is on screen rather than what the scroller contains.
    panel.style.setProperty('view-timeline-name', TIMELINE);
    panel.style.setProperty('view-timeline-axis', 'block');
    panel.style.setProperty('view-timeline-inset', '0 100dvh');
    // A named timeline is only visible to its subject's descendants unless an
    // ancestor widens its scope; the backdrop is a sibling of the panel.
    $el.style.setProperty('timeline-scope', TIMELINE);

    // The `Dialog` scroll lock is `overflow: hidden` on the page, which iOS
    // does not honour for a scroll chained from an inner scroller.
    const ownsOverscroll = window.getComputedStyle($el).overscrollBehaviorY === 'auto';
    if (ownsOverscroll) {
      $el.style.setProperty('overscroll-behavior-y', 'contain');
    }

    this.__publishesProgress = !CSS.supports('animation-timeline: view()');
    if (this.__publishesProgress) {
      this.$services.ticked.start();
    }

    return [
      super.mounted(),
      () => {
        this.__settle?.();
        this.__hasEntered = false;
        this.__previousProgress = -1;

        panel.style.removeProperty('view-timeline-name');
        panel.style.removeProperty('view-timeline-axis');
        panel.style.removeProperty('view-timeline-inset');
        $el.style.removeProperty('timeline-scope');
        $el.style.removeProperty(PROGRESS_PROPERTY);

        if (ownsOverscroll) {
          $el.style.removeProperty('overscroll-behavior-y');
        }
      },
    ];
  }

  /** Scroll the panel into view. Resolves once the scroll has ended. */
  async enter(): Promise<void> {
    this.state = 'entering';
    await this.__scrollTo(this.$el.scrollHeight - this.$el.clientHeight);
  }

  /**
   * Scroll the panel out of view. Resolves once the scroll has ended, and at
   * once when the panel is already out of view — swiped away, or never
   * opened.
   */
  async leave(): Promise<void> {
    this.state = 'leaving';
    this.__hasEntered = false;

    if (this.progress === 0) {
      // A swipe can still be settling past the point where the panel left
      // the screen. Land on the closed position now, so the next `enter()`
      // starts from it, rather than animating a scroll nobody can see.
      this.__settle?.();
      this.$el.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    await this.__scrollTo(0);
  }

  toggle(): Promise<void> {
    return this.state === 'entering' ? this.leave() : this.enter();
  }

  /**
   * Close the parent `Dialog` once the panel has left the screen by a swipe.
   *
   * Nothing happens while the sheet is leaving: that scroll is the close
   * itself, and reporting it would only close the dialog a second time.
   */
  intersected({ entry }: InViewProps): void {
    if (!entry || this.state === 'leaving') {
      return;
    }

    if (entry.intersectionRatio > 0) {
      this.__hasEntered = true;
      return;
    }

    if (!this.__hasEntered) {
      return;
    }

    this.__hasEntered = false;
    const dialog = this.$closest<Dialog>('Dialog');

    if (dialog?.isOpen) {
      void dialog.close();
    }
  }

  /**
   * Publish `--sheet-progress` where view timelines are not supported.
   *
   * Modelled on `--carousel-progress`: the value is read in the frame's read
   * phase, written back as the returned render, and the loop stops itself
   * once the value settles. `onScroll` starts it again.
   */
  ticked(): void | RafRender {
    const { progress } = this;

    if (progress === this.__previousProgress) {
      this.$services.ticked.stop();
      return;
    }

    this.__previousProgress = progress;

    return () => {
      this.$el.style.setProperty(PROGRESS_PROPERTY, String(progress));
    };
  }

  onScroll(): void {
    if (this.__publishesProgress) {
      this.$services.ticked.start();
    }
  }

  /**
   * Scroll the root to `top`, and resolve once the scroll has ended.
   *
   * A scroll that lands at once — already there, or `instant` under reduced
   * motion — resolves at once, because a scroll that does not move fires no
   * `scrollend`. Otherwise `scrollend` settles it, with a timeout as the
   * fallback; whichever comes first cancels the other.
   * @private
   */
  __scrollTo(top: number): Promise<void> {
    this.__settle?.();

    const { $el } = this;
    $el.scrollTo({ top, behavior: scrollBehavior() });

    if (Math.abs($el.scrollTop - top) < 1) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const settle = () => {
        this.__settle = null;
        window.clearTimeout(timer);
        $el.removeEventListener('scrollend', settle);
        resolve();
      };
      const timer = window.setTimeout(settle, SETTLE_TIMEOUT);
      $el.addEventListener('scrollend', settle);
      this.__settle = settle;
    });
  }
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/Sheet`) has always exposed it. Family members
 * and sub-components carry only their named export.
 */
export default Sheet;
