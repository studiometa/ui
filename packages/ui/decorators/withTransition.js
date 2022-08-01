import { transition, isArray } from '@studiometa/js-toolkit/utils';

/**
 * Manage transition with multiple targets.
 * @param   {HTMLElement|HTMLElement[]} element
 * @param   {Parameters<transition>[1]} name
 * @param   {Parameters<transition>[2]} endMode
 * @returns {Promise<void|void[]>}
 */
function delegateTransition(element, name, endMode) {
  return isArray(element)
    ? Promise.all(element.map((el) => transition(el, name, endMode)))
    : transition(element, name, endMode);
}

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
 *     get target(): HTMLElement|HTMLElement[];
 *     enter(target?: HTMLElement|HTMLElement[]): Promise<void|void[]>;
 *     leave(target?: HTMLElement|HTMLElement[]): Promise<void|void[]>;
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
     * @returns {HTMLElement|HTMLElement[]}
     */
    get target() {
      return this.$el;
    }

    /**
     * Trigger the enter transition.
     *
     * @this {Transition & TransitionInterface}
     * @param {HTMLElement|HTMLElement[]} [target]
     * @returns {Promise<void|void[]>}
     */
    enter(target) {
      const { enterFrom, enterActive, enterTo, enterKeep, leaveTo } = this.$options;

      return delegateTransition(
        target ?? this.target,
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
     * @param {HTMLElement|HTMLElement[]} [target]
     * @returns {Promise<void|void[]>}
     */
    leave(target) {
      const { leaveFrom, leaveActive, leaveTo, leaveKeep, enterTo } = this.$options;

      return delegateTransition(
        target ?? this.target,
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
