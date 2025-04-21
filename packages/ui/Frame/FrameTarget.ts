import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { addClass, transition } from '@studiometa/js-toolkit/utils';
import { Transition } from '../Transition/index.js';

export interface FrameTargetProps extends BaseProps {
  $options: {
    mode: 'replace' | 'prepend' | 'append';
    id: string;
    leaveKeep: true;
  };
}

/**
 * FrameTarget class.
 */
export class FrameTarget<T extends BaseProps = BaseProps> extends Transition<T & FrameTargetProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...Transition.config,
    name: 'FrameTarget',
    options: {
      ...Transition.config.options,
      mode: {
        type: String,
        default: 'replace', // or 'prepend' or 'append'
      },
      id: String,
    },
  };

  /**
   * Override options.
   */
  // @ts-ignore
  get $options() {
    const options = super.$options;

    options.leaveKeep = true;

    return options;
  }

  /**
   * Get uniq ID.
   */
  get id(): string {
    return this.$options.id ?? this.$el.id;
  }

  /**
   * Enter transition.
   */
  async enter() {
    this.$log('enter');

    const {
      mode,
      enterFrom: from,
      enterActive: active,
      enterTo: to,
      leaveTo,
      enterKeep,
    } = this.$options;
    const transitionStyles = { from, active, to };

    switch (mode) {
      case 'append':
      case 'prepend':
        await Promise.all(
          Array.from(this.$el.children)
            .filter((child) =>
              from.split(' ').every((className) => child.classList.contains(className)),
            )
            .map((child) =>
              transition(child as HTMLElement, transitionStyles, enterKeep ? 'keep' : undefined),
            ),
        );
        break;
      case 'replace':
      default:
        transitionStyles.from = Array.from(new Set([from, leaveTo].flat())).join(' ');
        await transition(this.$el, transitionStyles, enterKeep ? 'keep' : undefined);
    }
  }

  /**
   * Update the content from the new target.
   * @param   {Element|null} content The instance of the new target.
   * @returns {void}
   */
  updateContent(content: Element = null) {
    const { mode, enterFrom } = this.$options;

    if (!content) {
      return;
    }

    const children = Array.from(content.children);

    // @todo manage 'prepend' and 'append' transition
    // only the new content should have the transition
    // - add the leaveTo and enterFrom classes to all `newTarget.children`
    // - or wrap the new content in a custom div ?
    switch (mode) {
      case 'prepend':
      case 'append':
        addClass(children, enterFrom.split(' '));
        this.$el[mode](...children);
        break;
      case 'replace':
      default:
        this.$el.replaceChildren(...children);
        break;
    }
  }
}
