import { withExtraConfig } from '@studiometa/js-toolkit';
import type { GeolocateControlOptions } from 'mapbox-gl';
import {
  AbstractMapboxControl,
  type AbstractMapboxControlProps,
} from './AbstractMapboxControl.js';
import { getMapboxGl } from './dependencies.js';

export interface MapboxGeolocateControlProps extends AbstractMapboxControlProps {
  $options: AbstractMapboxControlProps['$options'] & Omit<GeolocateControlOptions, 'geolocation'>;
}

/**
 * Add a geolocate control to the map.
 * @see https://ui.studiometa.dev/reference/items/MapboxMap/
 */
export class MapboxGeolocateControl extends withExtraConfig(AbstractMapboxControl, {
  name: 'MapboxGeolocateControl',
  options: {
    positionOptions: Object,
    fitBoundsOptions: Object,
    trackUserLocation: Boolean,
    showAccuracyCircle: Boolean,
    showUserLocation: Boolean,
    showUserHeading: Boolean,
  },
}) {
  /**
   * Create the mapbox GeolocateControl instance.
   * @protected
   */
  createControl(options: GeolocateControlOptions) {
    return new (getMapboxGl().GeolocateControl)(options);
  }
}

export default MapboxGeolocateControl;
