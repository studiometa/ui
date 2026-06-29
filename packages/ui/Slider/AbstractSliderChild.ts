import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { nextFrame, domScheduler, isFunction } from '@studiometa/js-toolkit/utils';
import type { Slider } from './Slider.js';

/**
 * AbstractSliderChild class.
 */
export class AbstractSliderChild<T extends BaseProps = BaseProps> extends Base<T> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'AbstractSliderChild',
  };

  /**
   * Get the closest Slider ancestor.
   */
  get slider(): Slider | null {
    return this.$closest('Slider') as Slider | null;
  }

  /**
   * Listen to the `goto` event of the parent on mount.
   */
  mounted() {
    nextFrame(() => {
      this.slider?.$on('index', this);
    });
  }

  /**
   * Trigger update on resize.
   */
  resized() {
    nextFrame(() => {
      if (this.slider) {
        this.update(this.slider.currentIndex);
      }
    });
  }

  /**
   * Remove the event listener.
   */
  destroyed() {
    this.slider?.$off('index', this);
  }

  /**
   * Dispatch event.
   */
  handleEvent(event: CustomEvent) {
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
