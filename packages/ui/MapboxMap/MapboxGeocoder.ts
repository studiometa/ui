import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import { AbstractMapboxMapChild, AbstractMapboxMapChildProps } from './AbstractMapboxMapChild.js';
import GeocoderControl from '@mapbox/mapbox-gl-geocoder';
import * as mapboxgl from 'mapbox-gl';
import type { Map } from 'mapbox-gl';

export interface MapboxGeocoderProps extends AbstractMapboxMapChildProps {
  $options: {
    /**
     * Wether to add the geocoder to the map or to the component's root element.
     */
    addToMap: boolean;
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
      addToMap: Boolean,
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

  /**
   * Target element for the geocoder.
   */
  get target(): Map | HTMLElement | string {
    return this.$options.addToMap ? this.map : this.$el;
  }

  /**
   * Mounted hook.
   */
  mounted() {
    this.control.addTo(this.target);
  }

  /**
   * Destroyed hook.
   */
  destroyed() {
    this.map.removeControl(this.control);
    this.__control = undefined;
  }
}
