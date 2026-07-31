import { withExtraConfig } from '@studiometa/js-toolkit';
import mapboxgl from 'mapbox-gl';
import type { NavigationControlOptions } from 'mapbox-gl';
import {
  AbstractMapboxControl,
  type AbstractMapboxControlProps,
} from './AbstractMapboxControl.js';

export interface MapboxNavigationControlProps extends AbstractMapboxControlProps {
  $options: AbstractMapboxControlProps['$options'] & {
    showCompass: boolean;
    showZoom: boolean;
    visualizePitch: boolean;
  };
}

/**
 * Add a navigation control to the map.
 * @see https://ui.studiometa.dev/-/components/MapboxMap/
 */
export class MapboxNavigationControl extends withExtraConfig(AbstractMapboxControl, {
  name: 'MapboxNavigationControl',
  options: {
    showCompass: Boolean,
    showZoom: Boolean,
    visualizePitch: Boolean,
  },
}) {
  /**
   * Create the mapbox NavigationControl instance.
   * @protected
   */
  createControl(options: NavigationControlOptions) {
    return new mapboxgl.NavigationControl(options);
  }
}
