import { Base, withRelativePointer, getInstanceFromElement } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps, PointerServiceProps } from '@studiometa/js-toolkit';
import { Hoverable } from './Hoverable.js';
import { isFunction } from '@studiometa/js-toolkit/utils';

export interface HoverableControllerProps extends BaseProps {
  $options: {
    /**
     * A selector for the Hoverable component to control.
     */
    controls: string;
  };
}

/**
 * Controller for the Hoverable component.
 *
 * Allows controlling a Hoverable component from a separate element.
 * The controller captures pointer movements and forwards them to a controlled
 * Hoverable component specified by the `controls` option.
 *
 * @example
 * ```html
 * <div data-component="HoverableController" data-option-controls="my-hoverable"></div>
 *
 * <div data-component="Hoverable" id="my-hoverable">
 *   <div data-ref="target">...</div>
 * </div>
 * ```
 *
 * @see https://ui.studiometa.dev/-/components/Hoverable/
 */
export class HoverableController<T extends BaseProps = BaseProps> extends withRelativePointer(Base)<
  T & HoverableControllerProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'HoverableController',
    options: {
      controls: String,
    },
  };

  /**
   * Get the controlled Hoverable instance.
   */
  get hoverable(): Hoverable | null {
    const { controls } = this.$options;
    return controls
      ? getInstanceFromElement(document.querySelector(`#${controls}`), Hoverable)
      : null;
  }

  /**
   * Dispatch the progress from the controller to the controlled
   * Hoverable component.
   */
  movedrelative(props: PointerServiceProps) {
    const { hoverable } = this;
    if (hoverable && isFunction(hoverable.movedrelative)) {
      hoverable.movedrelative(props, true);
    }
  }
}
