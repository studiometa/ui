import type { BaseConfig, BaseProps, OptionChange } from '@studiometa/js-toolkit';
import type { gsap } from 'gsap';
import { AbstractGsapAnimation } from './AbstractGsapAnimation.js';
import type { AbstractGsapAnimationProps, GsapAnimationVars } from './AbstractGsapAnimation.js';
import type { GsapDependencies } from './dependencies.js';
import { createTween, readDeclaration } from './declaration.js';

export interface GsapProps extends BaseProps {
  $options: AbstractGsapAnimationProps['$options'] & {
    targets: string;
    set: gsap.TweenVars;
    from: gsap.TweenVars;
    to: gsap.TweenVars;
  };
}

/**
 * Gsap class.
 *
 * Animate elements with one [GSAP](https://gsap.com) tween declared in the
 * markup. `from` and `to` give a `fromTo()` tween, `from` alone a `from()`
 * tween and `to` alone a `to()` tween. The `set` variables are applied before
 * the tween. The `targets` selector resolves inside the root element, and an
 * empty value targets the root.
 *
 * The tween stays paused until `play()`, `data-option-autoplay` or a
 * `scrollTrigger` starts it. An `Action` can drive it:
 * `data-on:click="Gsap->target.play()"`.
 *
 * @link https://ui.studiometa.dev/reference/items/Gsap/
 */
export class Gsap<T extends BaseProps = BaseProps> extends AbstractGsapAnimation<GsapProps & T> {
  static config: BaseConfig = {
    name: 'Gsap',
    options: {
      targets: String,
      set: Object,
      from: Object,
      to: Object,
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

  /**
   * Create the tween that the options declare.
   * @protected
   */
  __create({ gsap: core }: GsapDependencies, vars: GsapAnimationVars) {
    const declaration = readDeclaration(this, this.$el, this.$options);
    return declaration ? createTween(core, declaration, vars) : null;
  }
}

export default Gsap;
