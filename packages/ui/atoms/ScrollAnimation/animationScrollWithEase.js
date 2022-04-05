import {
  easeOutQuad,
  easeInQuad,
  easeInOutQuad,
  easeOutCubic,
  easeInCubic,
  easeInOutCubic,
  easeOutQuart,
  easeInQuart,
  easeInOutQuart,
  easeOutQuint,
  easeInQuint,
  easeInOutQuint,
  easeOutSine,
  easeInSine,
  easeInOutSine,
  easeOutCirc,
  easeInCirc,
  easeInOutCirc,
  easeOutExpo,
  easeInExpo,
  easeInOutExpo,
} from '@studiometa/js-toolkit/utils';

const eases = {
  outQuad: easeOutQuad,
  inQuad: easeInQuad,
  inOutQuad: easeInOutQuad,
  outCubic: easeOutCubic,
  inCubic: easeInCubic,
  inOutCubic: easeInOutCubic,
  outQuart: easeOutQuart,
  inQuart: easeInQuart,
  inOutQuart: easeInOutQuart,
  outQuint: easeOutQuint,
  inQuint: easeInQuint,
  inOutQuint: easeInOutQuint,
  outSine: easeOutSine,
  inSine: easeInSine,
  inOutSine: easeInOutSine,
  outCirc: easeOutCirc,
  inCirc: easeInCirc,
  inOutCirc: easeInOutCirc,
  outExpo: easeOutExpo,
  inExpo: easeInExpo,
  inOutExpo: easeInOutExpo,
};

/**
 * @typedef {import('./AbstractScrollAnimation.js').AbstractScrollAnimationConstructor} AbstractScrollAnimationConstructor
 */

/**
 * Extend a `ScrollAnimation` component to use easings.
 * @template {AbstractScrollAnimationConstructor} T
 * @param   {T} ScrollAnimation A child class of the `AbstractScrollAnimation` class.
 * @returns {T}
 */
export default function animationScrollWithEase(ScrollAnimation) {
  // @ts-ignore
  return class extends ScrollAnimation {
    /* eslint-enable require-jsdoc */

    /**
     * Config.
     */
    static config = {
      ...ScrollAnimation.config,
      name: `${ScrollAnimation.config.name}WithEase`,
      options: {
        ...ScrollAnimation.config.options,
        ease: {
          type: String,
          default: 'outExpo',
        },
      },
    };

    /**
     * Eases the progress value.
     *
     * @param   {number} progress
     * @returns {void}
     */
    render(progress) {
      if (eases[this.$options.ease]) {
        // eslint-disable-next-line no-param-reassign
        progress = eases[this.$options.ease](progress);
      }

      super.render(progress);
    }
  }
}
