import { withExtraConfig } from '@studiometa/js-toolkit';
import mapboxgl from 'mapbox-gl';
import type { FullscreenControlOptions } from 'mapbox-gl';
import {
  AbstractMapboxControl,
  type AbstractMapboxControlProps,
} from './AbstractMapboxControl.js';

export interface MapboxFullscreenControlProps extends AbstractMapboxControlProps {}

/**
 * Add a fullscreen control to the map.
 * @see https://ui.studiometa.dev/-/components/MapboxMap/
 */
export class MapboxFullscreenControl extends withExtraConfig(AbstractMapboxControl, {
  name: 'MapboxFullscreenControl',
}) {
  /**
   * Create the mapbox FullscreenControl instance.
   * @protected
   */
  createControl(options: FullscreenControlOptions) {
    return new mapboxgl.FullscreenControl(options);
  }
}
