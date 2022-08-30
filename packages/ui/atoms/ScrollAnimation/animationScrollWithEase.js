import { ease } from '@studiometa/js-toolkit/utils';

const regex = /ease([A-Z])/;
const eases = Object.fromEntries(
  Object.entries(ease)
    .filter(([name]) => name.startsWith('ease'))
    .map(([name, value]) => [name.replace(regex, (match, $1) => $1.toLowerCase()), value]),
);

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
      if (typeof eases[this.$options.ease] === 'function') {
        // eslint-disable-next-line no-param-reassign
        progress = eases[this.$options.ease](progress);
      }

      super.render(progress);
    }
  };
}
