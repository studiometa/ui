import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import type { AnimationPlaybackControlsWithThen, AnimationSequence, SequenceOptions } from 'motion';
import { Motion } from './Motion.js';
import { getMotion } from './dependencies.js';

export interface MotionSequenceProps extends BaseProps {
  $children: {
    Motion: Motion[];
  };
  $options: {
    stagger: number;
  };
}

/**
 * MotionSequence class.
 *
 * Orchestrate the `Motion` children as one animation sequence: each child
 * declares its keyframes as usual, and the sequence composes them — in DOM
 * order — into a single timeline with Motion's [sequence support](https://motion.dev/docs/animate#timeline-sequencing).
 * The whole `Motion` playback surface applies to the sequence: an `Action`
 * can `play()`, `reverse()` or `seek()` the entire choreography, and a
 * `MotionScrollTimeline` can scrub it.
 *
 * By default segments run one after another; a child's `at` option positions
 * its segment explicitly (a time in seconds, a relative offset like `"-0.2"`,
 * or `"<"` for "with the previous"), and the `stagger` option spreads the
 * children automatically. The sequence owns the children's playback — leave
 * their `autoplay` off (its default) and enable it on the sequence itself
 * with `data-option-autoplay` to play on mount.
 *
 * Sequences need the full `motion` entry: `motion/mini`'s `animate()` does
 * not support them.
 *
 * @example
 * ```html
 * <ul data-component="MotionSequence" data-option-stagger="0.1" data-option-autoplay>
 *   <li data-component="Motion" data-option-animate='{ "opacity": 1, "y": 0 }' data-option-initial='{ "opacity": 0, "y": 16 }'>…</li>
 *   <li data-component="Motion" data-option-animate='{ "opacity": 1, "y": 0 }' data-option-initial='{ "opacity": 0, "y": 16 }'>…</li>
 * </ul>
 * ```
 *
 * @link https://ui.studiometa.dev/reference/items/MotionSequence/
 */
export class MotionSequence<T extends BaseProps = BaseProps> extends Motion<
  MotionSequenceProps & T
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'MotionSequence',
    components: { Motion },
    options: {
      stagger: Number,
    },
  };

  /**
   * The sequence has an animation to autoplay as soon as it has children
   * declaring keyframes.
   * @protected
   */
  get __hasDeclaredAnimation(): boolean {
    return this.__sequencedChildren.length > 0;
  }

  /**
   * The `Motion` children carrying keyframes, in DOM order.
   * @private
   */
  get __sequencedChildren(): Motion[] {
    const { Motion: children = [] } = this.$children;
    return children.filter((child) => Object.keys(child.$options.animate).length > 0);
  }

  /**
   * Build the sequence from the children declarations and make it the
   * current animation. Each segment merges the child's `transition` and its
   * `at` position; without an explicit `at`, the `stagger` option spreads the
   * segments, and with neither they run one after another (Motion's default).
   * @protected
   */
  __createControls(): AnimationPlaybackControlsWithThen {
    const motion = getMotion();
    const { stagger, transition } = this.$options;

    const sequence = this.__sequencedChildren.map((child, index) => {
      const { animate, transition: childTransition, at } = child.$options;
      const options: Record<string, unknown> = { ...childTransition };

      if (at !== '') {
        const numeric = Number(at);
        options.at = Number.isNaN(numeric) ? at : numeric;
      } else if (stagger > 0) {
        options.at = index * stagger;
      }

      return [child.$el, animate, options];
    });

    const controls = motion.animate(
      sequence as AnimationSequence,
      Object.keys(transition).length > 0 ? (transition as SequenceOptions) : undefined,
    );
    this.__controls = controls;
    this.__fromOptions = true;
    return controls;
  }
}

export default MotionSequence;
