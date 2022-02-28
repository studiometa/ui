import { transition } from '@studiometa/js-toolkit/utils';
import { Transition } from '../../primitives/index.js';

/**
 * FrameTarget class.
 */
export default class FrameTarget extends Transition {
  /**
   * Config.
   */
  static config = {
    name: 'FrameTarget',
    log: true,
    options: {
      mode: {
        type: String,
        default: 'replace', // or 'prepend' or 'append'
      },
      id: String,
    },
  };

  /**
   * Insert modes.
   */
  static __INSERT_MODES = {
    prepend: 'afterbegin',
    append: 'beforeend',
  };

  /**
   * Override options.
   */
  get $options() {
    const options = super.$options;

    options.leaveKeep = true;

    return options;
  }

  /**
   * Get uniq ID.
   * @returns {string}
   */
  get id() {
    return this.$options.id ?? this.$el.id;
  }

  /**
   * Enter transition.
   * @returns {Promise<void>}
   */
  async enter() {
    this.$log('enter');

    const {
      enterFrom: from,
      enterActive: active,
      enterTo: to,
      leaveTo,
    } = this.$options;
    const transitionStyles = { from, active, to };

    switch (this.$options.mode) {
      case 'append':
      case 'prepend':
        await Promise.all(
          Array.from(this.$el.children)
            .filter((child) =>
              from
                .split(' ')
                .every((className) => child.classList.contains(className))
            )
            .map((child) => {
              return transition(child, transitionStyles);
            })
        );
        break;
      case 'replace':
      default:
        transitionStyles.from = Array.from(
          new Set([from, leaveTo].flat())
        ).join(' ');
        await transition(this.$el, transitionStyles);
    }
  }

  /**
   * Update the content from the new target.
   *
   * @param   {Target} newTarget The instance of the new target.
   * @returns {void}
   */
  updateContent(newTarget) {
    // @todo manage 'prepend' and 'append' transition
    // only the new content should have the transition
    // - add the leaveTo and enterFrom classes to all `newTarget.children`
    // - or wrap the new content in a custom div ?
    switch (this.$options.mode) {
      case 'prepend':
      case 'append':
        // eslint-disable-next-line no-restricted-syntax
        for (const child of newTarget.$el.children) {
          child.classList.add(...this.$options.enterFrom.split(' '));
        }
        this.$el.insertAdjacentHTML(
          FrameTarget.__INSERT_MODES[this.$options.mode],
          newTarget.$el.innerHTML
        );
        break;
      case 'replace':
      default:
        this.$el.innerHTML = newTarget.$el.innerHTML;
        break;
    }
  }
}
