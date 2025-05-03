import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { Transition } from '../Transition/index.js';
import morphdom from 'morphdom';

export interface FrameTargetProps extends BaseProps {
  $options: {
    mode: 'replace' | 'prepend' | 'append';
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
    },
  };

  /**
   * Different mode of content insertion.
   */
  modes = {
    APPEND: 'append',
    PREPEND: 'prepend',
    REPLACE: 'replace',
  } as const;

  /**
   * Get uniq ID.
   */
  get id(): string {
    return this.$el.id;
  }

  /**
   * Update the content from the new target.
   */
  async updateContent(content: Element = null) {
    if (!content) {
      return;
    }

    const { mode } = this.$options;

    // In append or prepend mode, the leave transition can be used to
    // move the exisiting children of the root element, with the leave
    // transition being applied in parallel of the enter transition.
    if (mode === this.modes.APPEND || mode === this.modes.PREPEND) {
      const leaveTargets = Array.from(this.$el.children) as HTMLElement[];
      const enterTargets = Array.from(content.children) as HTMLElement[];

      this.$el[mode](...Array.from(content.childNodes));

      await Promise.all([
        this.leave(leaveTargets),
        this.enter(enterTargets),
      ]);
    } else {
      await this.leave();
      morphdom(this.$el, content);
      await this.enter();
    }
  }
}
