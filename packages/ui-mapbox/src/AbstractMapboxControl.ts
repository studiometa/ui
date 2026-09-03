import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import type { ControlPosition, IControl } from 'mapbox-gl';
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
} from './AbstractMapboxMapChild.js';

export interface AbstractMapboxControlProps extends AbstractMapboxMapChildProps {
  $options: {
    position: ControlPosition;
  };
}

/**
 * Base class for the Mapbox controls added to the map via `map.addControl`.
 *
 * It centralizes the shared `position` option, the lazy control instantiation
 * and the add/remove lifecycle. Concrete controls only need to implement the
 * `createControl` method to build their specific `mapboxgl.*Control` instance.
 *
 * @see https://ui.studiometa.dev/reference/items/MapboxMap/
 */
export class AbstractMapboxControl<T extends BaseProps = BaseProps> extends AbstractMapboxMapChild<
  T & AbstractMapboxControlProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'AbstractMapboxControl',
    options: {
      position: {
        type: String,
        default: 'top-right',
      },
    },
  };

  /**
   * Control instance.
   * @private
   */
  __control: IControl;

  /**
   * The mapbox control instance.
   */
  get control() {
    if (!this.__control) {
      // `position` is consumed by `map.addControl()`; every other option
      // belongs to the concrete control.
      const { position: _position, ...options } = this.$options;
      this.__control = this.createControl(options);
    }

    return this.__control;
  }

  /**
   * Create the concrete mapbox control instance.
   *
   * Subclasses must implement this method to return their specific
   * `mapboxgl.*Control` instance built from the given options.
   *
   * @protected
   */
  createControl(_options: Record<string, unknown>): IControl {
    throw new Error('The `createControl` method must be implemented.');
  }

  /**
   * Mounted hook.
   */
  mounted() {
    this.whenMapReady((map) => {
      map.addControl(this.control, this.$options.position);
    });
  }

  /**
   * Teardown hook.
   */
  __onDestroyed() {
    if (this.__control) {
      this.__readyMap?.removeControl(this.__control);
      this.__control = undefined;
    }
  }
}

export default AbstractMapboxControl;
