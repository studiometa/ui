import { Base } from '@studiometa/js-toolkit/Base';
import type { BaseConfig, BaseProps, OptionChange } from '@studiometa/js-toolkit';
import type { gsap } from 'gsap';

export interface GsapStepProps extends BaseProps {
  $options: {
    targets: string;
    set: gsap.TweenVars;
    from: gsap.TweenVars;
    to: gsap.TweenVars;
    at: string;
  };
}

/**
 * GsapStep class.
 *
 * Declare one tween of the nearest `GsapTimeline` ancestor. A step has the
 * options of `Gsap`, plus `at`: the position in the timeline, as a number of
 * seconds, a label or a relative position (`"<"`, `"-=0.2"`, `"intro+=1"`).
 *
 * A step never loads GSAP and never owns an animation: the timeline reads it.
 * Its option changes rebuild the timeline.
 *
 * @link https://ui.studiometa.dev/reference/items/GsapTimeline/
 */
export class GsapStep<T extends BaseProps = BaseProps> extends Base<GsapStepProps & T> {
  static config: BaseConfig = {
    name: 'GsapStep',
    mountStrategy: 'eager',
    options: {
      targets: String,
      set: Object,
      from: Object,
      to: Object,
      at: String,
    },
  };

  optionTargetsChanged(change: OptionChange) {
    this.__optionChanged(change);
  }

  optionSetChanged(change: OptionChange) {
    this.__optionChanged(change);
  }

  optionFromChanged(change: OptionChange) {
    this.__optionChanged(change);
  }

  optionToChanged(change: OptionChange) {
    this.__optionChanged(change);
  }

  optionAtChanged(change: OptionChange) {
    this.__optionChanged(change);
  }

  /**
   * Ask the owner timeline to rebuild.
   * @private
   */
  __optionChanged(change: OptionChange) {
    if (!change.initial) {
      this.$closest<Base & { rebuild(): void }>('GsapTimeline')?.rebuild();
    }
  }
}

export default GsapStep;
