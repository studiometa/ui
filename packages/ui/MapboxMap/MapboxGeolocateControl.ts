import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import { AbstractMapboxMapChild, AbstractMapboxMapChildProps } from './AbstractMapboxMapChild.js';
import { type ControlPosition, type GeolocateControlOptions, GeolocateControl } from 'mapbox-gl';

export interface MapboxGeolocateControlProps extends AbstractMapboxMapChildProps {
  $options: {
    position: ControlPosition;
  } & Omit<GeolocateControlOptions, 'geolocation'>;
}

/**
 * Add a navigation control to the map.
 * @see https://ui.studiometa.dev/-/components/MapboxMap/
 */
export class MapboxGeolocateControl<T extends BaseProps = BaseProps> extends AbstractMapboxMapChild<
  T & MapboxGeolocateControlProps
> {
  static config: BaseConfig = {
    name: 'MapboxGeolocateControl',
    options: {
      position: {
        type: String,
        default: 'top-right',
      },
      positionOptions: Object,
      fitBoundsOptions: Object,
      trackUserLocation: Boolean,
      showAccuracyCircle: Boolean,
      showUserLocation: Boolean,
      showUserHeading: Boolean,
    },
  };

  __control: GeolocateControl;

  get control() {
    if (!this.__control) {
      const { position, ...options } = this.$options;
      this.__control = new GeolocateControl(options);
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
