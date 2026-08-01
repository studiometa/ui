import { Base, type BaseProps } from '@studiometa/js-toolkit';
import type { MapboxMap } from './MapboxMap.js';

export interface AbstractMapboxMapChildProps extends BaseProps {}

/**
 * Base class for every component living inside a `MapboxMap`.
 *
 * It resolves the closest parent `MapboxMap` component via `$closest` and
 * exposes its Mapbox `Map` instance so children (markers, popups, controls,
 * layers, ...) can register themselves against it.
 *
 * @see https://ui.studiometa.dev/-/components/MapboxMap/
 */
export class AbstractMapboxMapChild<T extends BaseProps = BaseProps> extends Base<
  T & AbstractMapboxMapChildProps
> {
  /**
   * The closest parent `MapboxMap` component instance.
   */
  get mapboxMap() {
    const mapboxMap = this.$closest<MapboxMap>('MapboxMap');

    if (!mapboxMap) {
      this.$warn(
        'Can not find the parent map, does this component has a parent MapboxMap component?',
      );
    }

    return mapboxMap;
  }

  /**
   * The Mapbox `Map` instance of the closest parent `MapboxMap` component.
   */
  get map() {
    return this.mapboxMap?.map;
  }
}
