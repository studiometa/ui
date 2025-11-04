import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { Transition } from '../Transition/index.js';
import morphdom from 'morphdom';
import { adoptNewScripts } from '../Fetch/utils.js';

export interface FrameTargetProps extends BaseProps {
  $options: {
    mode: 'replace' | 'prepend' | 'append' | 'morph';
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
    name: 'FrameTarget',
    options: {
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
    MORPH: 'morph',
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
    const { $el, modes } = this;
    // @ts-expect-error querySelectoAll is iterable.
    const previousScripts: Set<HTMLScriptElement> = new Set(this.$el.querySelectorAll('script'));

    // In append or prepend mode, the leave transition can be used to
    // move the exisiting children of the root element, with the leave
    // transition being applied in parallel of the enter transition.
    if (mode === modes.APPEND || mode === modes.PREPEND) {
      const leaveTargets = Array.from($el.children) as HTMLElement[];
      const enterTargets = Array.from(content.children) as HTMLElement[];

      $el[mode](...Array.from(content.childNodes));
      // @ts-expect-error querySelectoAll is iterable.
      const newScripts: Set<HTMLScriptElement> = new Set(this.$el.querySelectorAll('script'));
      adoptNewScripts(newScripts, previousScripts);
      await Promise.all([this.leave(leaveTargets), this.enter(enterTargets)]);
    } else {
      await this.leave();
      if (mode === modes.MORPH) {
        morphdom($el, content);
      } else {
        $el.replaceChildren(...Array.from(content.childNodes));
      }
      // @ts-expect-error querySelectoAll is iterable.
      const newScripts: Set<HTMLScriptElement> = new Set(this.$el.querySelectorAll('script'));
      adoptNewScripts(newScripts, previousScripts);
      await this.enter();
    }
  }
}
