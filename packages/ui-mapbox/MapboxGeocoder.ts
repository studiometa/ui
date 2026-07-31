import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import GeocoderControl from '@mapbox/mapbox-gl-geocoder';
import mapboxgl from 'mapbox-gl';
import type { Map } from 'mapbox-gl';
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
} from './AbstractMapboxMapChild.js';

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
 * Add a geocoder control to the map.
 * @see https://ui.studiometa.dev/-/components/MapboxMap/
 */
export class MapboxGeocoder<T extends BaseProps = BaseProps> extends AbstractMapboxMapChild<
  T & MapboxGeocoderProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'MapboxGeocoder',
    options: {
      addToMap: Boolean,
      options: Object,
    },
  };

  /**
   * Control instance.
   * @private
   */
  __control: GeocoderControl;

  /**
   * The mapbox-gl-geocoder control instance.
   */
  get control() {
    if (!this.__control) {
      const options = {
        ...this.$options.options,
        mapboxgl: mapboxgl as unknown as typeof import('mapbox-gl'),
        accessToken: this.$options.options.accessToken ?? this.mapboxMap.$options.accessToken,
      };
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
    if (this.$options.addToMap) {
      this.map?.removeControl(this.control);
    } else {
      this.control.onRemove();
    }
    this.__control = undefined;
  }
}
