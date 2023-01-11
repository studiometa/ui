import type { BaseConfig, BaseProps, BaseDecorator, BaseInterface } from '@studiometa/js-toolkit';
import { ease } from '@studiometa/js-toolkit/utils';
import type { AbstractScrollAnimation } from './AbstractScrollAnimation.js';

const regex = /ease([A-Z])/;
const eases = Object.fromEntries(
  Object.entries(ease)
    .filter(([name]) => name.startsWith('ease'))
    .map(([name, value]) => [name.replace(regex, (match, $1) => $1.toLowerCase()), value]),
);

export interface AnimationScrollWithEaseProps extends BaseProps {
  $options: {
    ease: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AnimationScrollWithEaseInterface extends BaseInterface {}

/**
 * Extend a `ScrollAnimation` component to use easings.
 */
export function animationScrollWithEase<S extends AbstractScrollAnimation>(
  ScrollAnimation: typeof AbstractScrollAnimation,
): BaseDecorator<AnimationScrollWithEaseInterface, S, AnimationScrollWithEaseProps> {
  class AnimationScrollWithEase extends ScrollAnimation<AnimationScrollWithEaseProps> {
    /**
     * Config.
     */
    static config: BaseConfig = {
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
    render(progress: number) {
      if (typeof eases[this.$options.ease] === 'function') {
        // eslint-disable-next-line no-param-reassign
        progress = eases[this.$options.ease](progress);
      }

      super.render(progress);
    }
  }

  // @ts-ignore
  return AnimationScrollWithEase;
}
