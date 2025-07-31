import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import { AbstractMapboxMapChild, AbstractMapboxMapChildProps } from './AbstractMapboxMapChild.js';
import { ControlPosition, NavigationControl } from 'mapbox-gl';

export interface MapboxNavigationControlProps extends AbstractMapboxMapChildProps {
  $options: {
    position: ControlPosition;
    showCompass: boolean;
    showZoom: boolean;
    visualizePitch: boolean;
  };
}

/**
 * Add a navigation control to the map.
 * @see https://ui.studiometa.dev/-/components/MapboxMap/
 */
export class MapboxNavigationControl<
  T extends BaseProps = BaseProps,
> extends AbstractMapboxMapChild<T & MapboxNavigationControlProps> {
  static config: BaseConfig = {
    name: 'MapboxNavigationControl',
    options: {
      position: {
        type: String,
        default: 'top-right',
      },
      showCompass: Boolean,
      showZoom: Boolean,
      visualizePitch: Boolean,
    },
  };

  __control: NavigationControl;

  get control() {
    if (!this.__control) {
      const { position, ...options } = this.$options;
      this.__control = new NavigationControl(options);
    }

    return this.__control;
  }

  mounted() {
    this.map.addControl(this.control, this.$options.position);
  }

  destroyed() {
    this.map.removeControl(this.control);
    this.__control = undefined;
  }
}
