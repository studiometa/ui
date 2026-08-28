import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import type { NavigationControlOptions } from 'mapbox-gl';
import { AbstractMapboxControl, type AbstractMapboxControlProps } from './AbstractMapboxControl.js';
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
 *
 * A plain subclass with its own `static config`: v4 merges config along the
 * prototype chain, so the three options below join the `position` option
 * `AbstractMapboxControl` declares without `withExtraConfig()` in between.
 *
 * @see https://ui.studiometa.dev/reference/items/MapboxMap/
 */
export class MapboxNavigationControl<T extends BaseProps = BaseProps> extends AbstractMapboxControl<
  T & MapboxNavigationControlProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'MapboxNavigationControl',
    options: {
      showCompass: Boolean,
      showZoom: Boolean,
      visualizePitch: Boolean,
    },
  };

  /**
   * Create the mapbox NavigationControl instance.
   * @protected
   */
  createControl(options: NavigationControlOptions) {
    return new (getMapboxGl().NavigationControl)(options);
  }
}

export default MapboxNavigationControl;
