import { withExtraConfig } from '@studiometa/js-toolkit/withExtraConfig';
import type { NavigationControlOptions } from 'mapbox-gl';
import {
  AbstractMapboxControl,
  type AbstractMapboxControlProps,
} from './AbstractMapboxControl.js';
import { getMapboxGl } from './dependencies.js';

export interface MapboxNavigationControlProps extends AbstractMapboxControlProps {
  $options: AbstractMapboxControlProps['$options'] & {
    showCompass: boolean;
    showZoom: boolean;
    visualizePitch: boolean;
  };
}

/**
 * Add a navigation control to the map.
 * @see https://ui.studiometa.dev/reference/items/MapboxMap/
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
    return new (getMapboxGl().NavigationControl)(options);
  }
}

export default MapboxNavigationControl;
