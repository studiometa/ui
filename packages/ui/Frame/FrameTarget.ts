import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { addClass, transition } from '@studiometa/js-toolkit/utils';
import { Transition } from '../Transition/index.js';
import morphdom from 'morphdom';

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
  // @ts-expect-error $options is always a getter.
  get $options() {
    const options = super.$options;

    options.leaveKeep = true;

    return options;
  }

  /**
   * Get uniq ID.
   */
  get id(): string {
    return this.$options.id || this.$el.id;
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

  async leave() {
    this.$log('leave');

    // Leave transitions are active only for the replace mode by default.
    if (this.$options.mode !== 'replace') {
      return;
    }

    return super.leave();
  }

  /**
   * Update the content from the new target.
   */
  async updateContent(content: Element = null) {
    const { mode, enterFrom } = this.$options;

    if (!content) {
      return;
    }

    await this.leave();
    const children = Array.from(content.children);

    switch (mode) {
      case 'prepend':
      case 'append':
        addClass(children, enterFrom.split(' ').filter(Boolean));
        this.$el[mode](...Array.from(content.childNodes));
        break;
      case 'replace':
      default:
        // Using morphdom allows us to keep state for the DOM node that do not changes,
        // for example keeping the focus in an input element at the right place
        morphdom(this.$el, content);
        break;
    }

    await this.enter();
  }
}
