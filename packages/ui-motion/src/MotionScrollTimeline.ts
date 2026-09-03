import { Base } from '@studiometa/js-toolkit/Base';
import { whenDOMSettled } from '@studiometa/js-toolkit/whenDOMSettled';
import type { BaseProps, BaseConfig, ChildrenCollection } from '@studiometa/js-toolkit';
import type { scroll } from 'motion';
import { Motion } from './Motion.js';
import { resolveMotion } from './dependencies.js';

/**
 * The options `scroll()` accepts, widened with `trackContentSize`.
 *
 * `scroll()` forwards every option it does not read itself to `scrollInfo()`,
 * which declares `trackContentSize` on its own `ScrollInfoOptions` — Motion's
 * public `ScrollOptions` interface simply omits it.
 */
type ScrollOptions = NonNullable<Parameters<typeof scroll>[1]> & {
  trackContentSize?: boolean;
};

export interface MotionScrollTimelineProps extends BaseProps {
  $options: {
    offset: string[];
    axis: 'x' | 'y';
    trackContentSize: boolean;
  };
}

/**
 * MotionScrollTimeline class.
 *
 * The scroll driver for a group of animations: this element's traversal of the
 * viewport defines the timeline, and every `Motion` child it contains is bound
 * to that progress with Motion's `scroll()` — hardware-accelerated where the
 * browser supports `ScrollTimeline`. The children declare their keyframes as
 * usual and keep their whole playback surface; the timeline takes over their
 * playback on mount — leave their `autoplay` off (its default) so nothing
 * plays before the link lands.
 *
 * `scroll()` is not part of `motion/mini`: when the injected module lacks it,
 * the timeline warns and leaves its children untouched.
 *
 * @example
 * ```html
 * <section data-component="MotionScrollTimeline" class="h-[300vh]">
 *   <div data-component="Motion" data-option-animate='{ "opacity": [0, 1, 0] }'>
 *     Content
 *   </div>
 * </section>
 * ```
 *
 * @link https://ui.studiometa.dev/reference/items/MotionScrollTimeline/
 */
export class MotionScrollTimeline<T extends BaseProps = BaseProps> extends Base<
  MotionScrollTimelineProps & T
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'MotionScrollTimeline',
    components: { Motion },
    options: {
      offset: { type: Array, default: () => ['start end', 'end start'] },
      axis: { type: String, default: 'y' },
      trackContentSize: Boolean,
    },
  };

  /**
   * The stop function of each `scroll()` link, released on unmount.
   * @private
   */
  __stops: VoidFunction[] = [];

  /**
   * The mounted `Motion` descendants, live and in DOM order.
   * @private
   */
  __children: ChildrenCollection<Motion> = this.$watchChildren<Motion>('Motion');

  /**
   * Bind every `Motion` child to this element's scroll progress, and release
   * every link when the mount cycle ends.
   */
  async mounted() {
    // Mount order is not guaranteed and `$watchChildren()` seeds its collection
    // in a microtask, so the timeline can reach `mounted()` before a single
    // child exists. `whenDOMSettled()` waits for the mutation batch that brought
    // this subtree in to finish mounting everything eager in it.
    const [motion] = await Promise.all([resolveMotion(), whenDOMSettled()]);

    if (!this.$isMounted) {
      return;
    }

    if (!motion.scroll) {
      this.$warn(
        'motion-scroll-timeline.missing-scroll',
        'The resolved motion module has no `scroll()` (e.g. `motion/mini`). Provide the full `motion` entry to use MotionScrollTimeline.',
      );
      return;
    }

    for (const child of this.__children) {
      this.__link(motion.scroll, child);
    }

    return () => {
      for (const stop of this.__stops) {
        stop();
      }
      this.__stops = [];
    };
  }

  /**
   * Bind one child's declared animation to the timeline: `seek(0)` builds it
   * paused when nothing has played yet, then `scroll()` takes over its
   * playback.
   * @private
   */
  async __link(scrollFn: typeof scroll, child: Motion) {
    await child.seek(0);
    const { controls } = child;

    if (!controls) {
      return;
    }

    const { offset, axis, trackContentSize } = this.$options;
    const options: ScrollOptions = { target: this.$el, axis };
    if (offset.length > 0) {
      options.offset = offset as ScrollOptions['offset'];
    }
    if (trackContentSize) {
      options.trackContentSize = true;
    }
    this.__stops.push(scrollFn(controls, options));
  }
}

export default MotionScrollTimeline;
