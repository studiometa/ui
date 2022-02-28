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
   * Trigger the enter transition.
   *
   * @todo merge leaveTo and enterFrom classes when leaveKeep is active
   * @this {TransitionInterface}
   * @returns {Promise<void>}
   */
  enter() {
    const { enterFrom, enterActive, enterTo, enterKeep } = this.$options;

    return transition(
      this.$el,
      {
        from: enterFrom,
        active: enterActive,
        to: enterTo,
      },
      enterKeep && 'keep'
    );
  }

  /**
   * Trigger the leave transition.
   *
   * @todo merge enterTo and leaveTo classes when enterKeep is active
   * @this {TransitionInterface}
   * @returns {Promise<void>}
   */
  leave() {
    const { leaveFrom, leaveActive, leaveTo, leaveKeep } = this.$options;

    return transition(
      this.$el,
      {
        from: leaveFrom,
        active: leaveActive,
        to: leaveTo,
      },
      leaveKeep && 'keep'
    );
  }
}
