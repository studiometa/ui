import { Base } from '@studiometa/js-toolkit';
import { transition } from '@studiometa/js-toolkit/utils';

/**
 * @typedef {Object} TransitionOptions
 * @property {string} enterFrom
 * @property {string} enterActive
 * @property {string} enterTo
 * @property {boolean} enterKeep
 * @property {string} leaveFrom
 * @property {string} leaveActive
 * @property {string} leaveTo
 * @property {boolean} leaveKeep
 */

/**
 * Transition class.
 * @typedef {Transition & { $options: TransitionOptions }} TransitionInterface
 */
export default class Transition extends Base {
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
   * @this {TransitionInterface}
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
   * @this {TransitionInterface}
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
