import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import mapboxgl from 'mapbox-gl';
import type { Map } from 'mapbox-gl';
// Type-only import: erased at build time, so it never triggers a runtime
// resolution of the optional `@mapbox/mapbox-gl-geocoder` peer dependency. The
// actual module is loaded lazily via a dynamic `import()` in `mounted()`.
import type GeocoderControl from '@mapbox/mapbox-gl-geocoder';
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
 *
 * The `@mapbox/mapbox-gl-geocoder` module is an optional peer dependency and is
 * loaded on demand with a dynamic `import()` when the component mounts, so the
 * rest of the package keeps working without it installed.
 *
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
   * Control instance, created once the lazily imported module resolves.
   * @private
   */
  __control?: GeocoderControl;

  /**
   * The mapbox-gl-geocoder control instance, if it has been created yet.
   */
  get control(): GeocoderControl | undefined {
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
   *
   * Lazily loads the optional `@mapbox/mapbox-gl-geocoder` module before
   * building and adding the control.
   */
  async mounted() {
    const { default: GeocoderControlClass } = await import('@mapbox/mapbox-gl-geocoder');

    // The component may have been destroyed while the dynamic import was still
    // resolving. Bail out before creating and adding the control, otherwise it
    // would be attached after `destroyed()` already ran (and saw `__control`
    // undefined), leaking an orphan control.
    if (!this.$isMounted) {
      return;
    }

    const options = {
      ...this.$options.options,
      mapboxgl: mapboxgl as unknown as typeof import('mapbox-gl'),
      accessToken: this.$options.options.accessToken ?? this.mapboxMap.$options.accessToken,
    };
    this.__control = new GeocoderControlClass(options);
    this.__control.addTo(this.target);
  }

  /**
   * Destroyed hook.
   */
  destroyed() {
    // The control may not exist yet: the dynamic import in `mounted()` might not
    // have resolved, or the geocoder module was never loaded.
    if (!this.__control) {
      return;
    }

    if (this.$options.addToMap) {
      this.map?.removeControl(this.__control);
    } else {
      this.__control.onRemove();
    }
    this.__control = undefined;
  }
}
