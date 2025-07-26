import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import { AbstractMapboxMapChild, AbstractMapboxMapChildProps } from './AbstractMapboxMapChild.js';
import GeocoderControl from '@mapbox/mapbox-gl-geocoder';
import * as mapboxgl from 'mapbox-gl';
import type { ControlPosition } from 'mapbox-gl';

export interface MapboxGeocoderProps extends AbstractMapboxMapChildProps {
  $options: {
    position: ControlPosition;
    /**
     * All MapboxGeocoder options, except the non serializable ones.
     * @see https://github.com/mapbox/mapbox-gl-geocoder/blob/master/API.md#parameters
     */
    options: Omit<
      GeocoderControl.GeocoderOptions,
      'filter' | 'externalGeocoder' | 'render' | 'getItemValue' | 'localGeocoder'
    >;
  };
}

/**
 * Add a navigation control to the map.
 * @see https://ui.studiometa.dev/-/components/MapboxMap/
 */
export class MapboxGeocoder<T extends BaseProps = BaseProps> extends AbstractMapboxMapChild<
  T & MapboxGeocoderProps
> {
  static config: BaseConfig = {
    name: 'MapboxGeocoder',
    options: {
      position: {
        type: String,
        default: 'top-right',
      },
      options: Object,
    },
  };

  __control: GeocoderControl;

  get control() {
    if (!this.__control) {
      const { options } = this.$options;
      options.mapboxgl = mapboxgl;
      if (!options.accessToken) {
        options.accessToken = this.$parent.$options.accessToken;
      }
      this.__control = new GeocoderControl(options);
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
