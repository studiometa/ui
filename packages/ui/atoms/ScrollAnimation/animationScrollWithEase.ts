import type { Base, BaseConfig, BaseConstructor, BaseTypeParameter } from '@studiometa/js-toolkit';
import { ease } from '@studiometa/js-toolkit/utils';
import type { AbstractScrollAnimation } from './AbstractScrollAnimation.js';

const regex = /ease([A-Z])/;
const eases = Object.fromEntries(
  Object.entries(ease)
    .filter(([name]) => name.startsWith('ease'))
    .map(([name, value]) => [name.replace(regex, (match, $1) => $1.toLowerCase()), value]),
);

/**
 * Extend a `ScrollAnimation` component to use easings.
 */
export function animationScrollWithEase<
  S extends BaseConstructor<AbstractScrollAnimation> = BaseConstructor<AbstractScrollAnimation>,
  T extends BaseTypeParameter = BaseTypeParameter
>(ScrollAnimation: S) {
  class AnimationScrollWithEase extends ScrollAnimation {
    /**
     * Config.
     */
    static config : BaseConfig = {
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
     */
    render(progress:number) {
      if (typeof eases[this.$options.ease] === 'function') {
        // eslint-disable-next-line no-param-reassign
        progress = eases[this.$options.ease](progress);
      }

      super.render(progress);
    }
  }

  return AnimationScrollWithEase as BaseConstructor<AnimationScrollWithEase> &
    Pick<typeof AnimationScrollWithEase, keyof typeof AnimationScrollWithEase> &
    S &
    BaseConstructor<AbstractScrollAnimation> &
    Pick<typeof AbstractScrollAnimation, keyof typeof AbstractScrollAnimation> &
    BaseConstructor<Base<T>> &
    Pick<typeof Base, keyof typeof Base>;
}
