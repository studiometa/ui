import { withScrolledInView } from '@studiometa/js-toolkit';
import type { BaseConfig } from '@studiometa/js-toolkit';
import { AbstractScrollAnimation } from './AbstractScrollAnimation.js';
import type { ScrollAnimationChildInterface } from './AbstractScrollAnimation.js';

/**
 * ScrollAnimation class.
 */
export class ScrollAnimation extends withScrolledInView<typeof AbstractScrollAnimation, ScrollAnimationChildInterface>(AbstractScrollAnimation, {}) {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...AbstractScrollAnimation.config,
    name: 'ScrollAnimation',
    refs: ['target'],
  };

  /**
   * Use the `target` ref as animation target.
   */
  get target():HTMLElement {
    return this.$refs.target as HTMLElement;
  }

  /**
   * Get the damp factor from the freezed options.
   */
  // @ts-ignore
  get dampFactor():number {
    return this.$options.dampFactor;
  }

  /**
   * Get the damp precision from the freezed options.
   * @returns {number}
   */
  // @ts-ignore
  get dampPrecision() {
    return this.$options.dampPrecision;
  }
}
