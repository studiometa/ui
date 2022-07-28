import { transition } from '@studiometa/js-toolkit/utils';

/**
 * @typedef {{
 *   $options: {
 *     enterFrom: string,
 *     enterActive: string,
 *     enterTo: string,
 *     enterKeep: boolean,
 *     leaveFrom: string,
 *     leaveActive: string,
 *     leaveTo: string,
 *     leaveKeep: boolean,
 *   }
 * }} TransitionInterface
 */

/**
 * Extend a class to add transition capabilities.
 * @template {typeof import('@studiometa/js-toolkit').Base} T
 * @param    {T} BaseClass
 * @returns  {T & {
 *   new(...a: any[]): {
 *     target: HTMLElement;
 *     enter(): Promise<void>;
 *     leave(): Promise<void>;
 *   }
 * }}
 */
export default function withTransition(BaseClass) {
  /* eslint-disable require-jsdoc */
  // @ts-ignore
  class Transition extends BaseClass {
    /* eslint-enable require-jsdoc */
    static config = {
      name: 'Transition',
      options: {
        enterFrom: String,
        enterActive: String,
        enterTo: String,
        enterKeep: Boolean,
        leaveFrom: String,
        leaveActive: String,
        leaveTo: String,
        leaveKeep: Boolean,
      },
    };

    /**
     * Get the transition target.
     *
     * @returns {HTMLElement}
     */
    get target() {
      return this.$el;
    }

    /**
     * Trigger the enter transition.
     *
     * @this {Transition & TransitionInterface}
     * @returns {Promise<void>}
     */
    enter() {
      const { enterFrom, enterActive, enterTo, enterKeep, leaveTo } = this.$options;

      return transition(
        this.target,
        {
          // eslint-disable-next-line prefer-template
          from: (leaveTo + ' ' + enterFrom).trim(),
          active: enterActive,
          to: enterTo,
        },
        enterKeep && 'keep'
      );
    }

    /**
     * Trigger the leave transition.
     *
     * @this {Transition & TransitionInterface}
     * @returns {Promise<void>}
     */
    leave() {
      const { leaveFrom, leaveActive, leaveTo, leaveKeep, enterTo } = this.$options;

      return transition(
        this.target,
        {
          // eslint-disable-next-line prefer-template
          from: (enterTo + ' ' + leaveFrom).trim(),
          active: leaveActive,
          to: leaveTo,
        },
        leaveKeep && 'keep'
      );
    }
  }

  return Transition;
}
