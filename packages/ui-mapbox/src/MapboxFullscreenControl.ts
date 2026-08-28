import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import type { FullscreenControlOptions } from 'mapbox-gl';
import { AbstractMapboxControl, type AbstractMapboxControlProps } from './AbstractMapboxControl.js';
import { getMapboxGl } from './dependencies.js';

export interface MapboxFullscreenControlProps extends AbstractMapboxControlProps {}

/**
 * Add a fullscreen control to the map.
 *
 * A plain subclass with its own `static config`: v3 needed `withExtraConfig()`
 * because it did not merge config along the prototype chain, so a subclass had
 * to be handed its parent's options. v4 merges them (collections merge,
 * declared scalars override), which is all the decorator ever did.
 *
 * @see https://ui.studiometa.dev/reference/items/MapboxMap/
 */
export class MapboxFullscreenControl<T extends BaseProps = BaseProps> extends AbstractMapboxControl<
  T & MapboxFullscreenControlProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'MapboxFullscreenControl',
  };

  /**
   * Create the mapbox FullscreenControl instance.
   * @protected
   */
  createControl(options: FullscreenControlOptions) {
    return new (getMapboxGl().FullscreenControl)(options);
  }
}

export default MapboxFullscreenControl;
