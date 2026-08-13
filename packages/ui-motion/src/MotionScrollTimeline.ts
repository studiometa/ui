import { Base } from '@studiometa/js-toolkit/Base';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import type { scroll } from 'motion';
import { Motion } from './Motion.js';
import { resolveMotion } from './dependencies.js';

type ScrollOptions = NonNullable<Parameters<typeof scroll>[1]>;

export interface MotionScrollTimelineProps extends BaseProps {
  $children: {
    Motion: Motion[];
  };
  $options: {
    offset: string[];
    axis: 'x' | 'y';
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
 * playback on mount, so give them `data-option-no-autoplay` to avoid a play
 * before the link lands.
 *
 * `scroll()` is not part of `motion/mini`: when the injected module lacks it,
 * the timeline warns and leaves its children untouched.
 *
 * @example
 * ```html
 * <section data-component="MotionScrollTimeline" class="h-[300vh]">
 *   <div data-component="Motion" data-option-animate='{ "opacity": [0, 1, 0] }' data-option-no-autoplay>
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
    },
  };

  /**
   * The stop function of each `scroll()` link, released on destroy.
   * @private
   */
  __stops: VoidFunction[] = [];

  /**
   * Bind every `Motion` child to this element's scroll progress.
   */
  async mounted() {
    const motion = await resolveMotion();

    if (!this.$isMounted) {
      return;
    }

    if (!motion.scroll) {
      this.$warn(
        'The resolved motion module has no `scroll()` (e.g. `motion/mini`). Provide the full `motion` entry to use MotionScrollTimeline.',
      );
      return;
    }

    for (const child of this.$children.Motion) {
      this.__link(motion.scroll, child);
    }
  }

  /**
   * Release every scroll link on destroy.
   */
  destroyed() {
    for (const stop of this.__stops) {
      stop();
    }
    this.__stops = [];
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

    const { offset, axis } = this.$options;
    const options: ScrollOptions = { target: this.$el, axis };
    if (offset.length > 0) {
      options.offset = offset as ScrollOptions['offset'];
    }
    this.__stops.push(scrollFn(controls, options));
  }
}

export default MotionScrollTimeline;
