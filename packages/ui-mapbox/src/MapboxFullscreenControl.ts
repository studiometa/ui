import { withExtraConfig } from '@studiometa/js-toolkit/withExtraConfig';
import type { FullscreenControlOptions } from 'mapbox-gl';
import {
  AbstractMapboxControl,
  type AbstractMapboxControlProps,
} from './AbstractMapboxControl.js';
import { getMapboxGl } from './dependencies.js';

export interface MapboxFullscreenControlProps extends AbstractMapboxControlProps {}

/**
 * Add a fullscreen control to the map.
 * @see https://ui.studiometa.dev/reference/items/MapboxMap/
 */
export class MapboxFullscreenControl extends withExtraConfig(AbstractMapboxControl, {
  name: 'MapboxFullscreenControl',
}) {
  /**
   * Create the mapbox FullscreenControl instance.
   * @protected
   */
  createControl(options: FullscreenControlOptions) {
    return new (getMapboxGl().FullscreenControl)(options);
  }
}

export default MapboxFullscreenControl;
