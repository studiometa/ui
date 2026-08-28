import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import type { GeolocateControlOptions } from 'mapbox-gl';
import { AbstractMapboxControl, type AbstractMapboxControlProps } from './AbstractMapboxControl.js';
import { getMapboxGl } from './dependencies.js';

export interface MapboxGeolocateControlProps extends AbstractMapboxControlProps {
  $options: AbstractMapboxControlProps['$options'] & Omit<GeolocateControlOptions, 'geolocation'>;
}

/**
 * Add a geolocate control to the map.
 *
 * A plain subclass with its own `static config`: v4 merges config along the
 * prototype chain, so these options join the `position` option
 * `AbstractMapboxControl` declares without `withExtraConfig()` in between.
 *
 * @see https://ui.studiometa.dev/reference/items/MapboxMap/
 */
export class MapboxGeolocateControl<T extends BaseProps = BaseProps> extends AbstractMapboxControl<
  T & MapboxGeolocateControlProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'MapboxGeolocateControl',
    options: {
      positionOptions: Object,
      fitBoundsOptions: Object,
      trackUserLocation: Boolean,
      showAccuracyCircle: Boolean,
      showUserLocation: Boolean,
      showUserHeading: Boolean,
    },
  };

  /**
   * Create the mapbox GeolocateControl instance.
   * @protected
   */
  createControl(options: GeolocateControlOptions) {
    return new (getMapboxGl().GeolocateControl)(options);
  }
}

export default MapboxGeolocateControl;
