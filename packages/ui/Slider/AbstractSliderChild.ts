import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { nextFrame, domScheduler, isFunction } from '@studiometa/js-toolkit/utils';
import { Slider } from './Slider.js';

export interface AbstractSliderChildProps extends BaseProps {
  $parent: Slider;
}

/**
 * AbstractSliderChild class.
 */
export class AbstractSliderChild<T extends BaseProps = BaseProps> extends Base<
  T & AbstractSliderChildProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'AbstractSliderChild',
  };

  /**
   * Listen to the `goto` event of the parent on mount.
   */
  mounted() {
    if (!(this.$parent instanceof Slider)) {
      throw new Error(
        `The \`${this.$options.name}\` component must be a direct child of a \`Slider\` component.`,
      );
    }

    this.$parent.$on('index', this);
  }

  /**
   * Trigger update on resize.
   */
  resized() {
    nextFrame(() => {
      this.update(this.$parent.currentIndex);
    });
  }

  /**
   * Remove the event listener.
   */
  destroyed() {
    this.$parent.$off('index', this);
  }

  /**
   * Dispatch event.
   * @param   {CustomEvent} event
   * @returns {void}
   */
  handleEvent(event) {
    if (event.type === 'index') {
      domScheduler.read(() => {
        const callback = this.update(event.detail[0]);
        if (isFunction(callback)) {
          domScheduler.write(() => {
            // @ts-ignore
            callback();
          });
        }
      });
    }
  }

  /**
   * Update the child component with the given index.
   */
  update(index: number): void | (() => void) {
    throw new Error(`The \`AbstractSliderChild.update(${index})\` method must be implemented.`);
  }
}
