import { Base, type BaseProps } from '@studiometa/js-toolkit';
import type { Map } from 'mapbox-gl';
import type { MapboxMap } from './MapboxMap.js';

export interface AbstractMapboxMapChildProps extends BaseProps {}

/**
 * Base class for every component living inside a `MapboxMap`.
 *
 * Children are self-sufficient and dynamic-DOM-native: they resolve their
 * parent `MapboxMap` on their own via `$closest`, wait for the map to be ready
 * with `whenMapReady`, then inject their contribution. Because they are
 * registered globally (see `registerMapboxComponents`), js-toolkit's document
 * wide `MutationObserver` mounts them whenever their element enters the DOM —
 * statically, `Fetch`-injected or `appendChild`-ed — and terminates them when it
 * leaves, at which point they remove their contribution again.
 *
 * @see https://ui.studiometa.dev/-/components/MapboxMap/
 */
export class AbstractMapboxMapChild<T extends BaseProps = BaseProps> extends Base<
  T & AbstractMapboxMapChildProps
> {
  /**
   * The parent `MapboxMap` resolved at ready-time.
   *
   * `destroyed()` runs *after* the element has been detached from the DOM (e.g.
   * a `Fetch` list swap, or the parent map itself being removed), and a
   * `$closest` lookup on a disconnected node returns nothing — a real bug that
   * would leave the child's contribution stuck on the map. Caching the resolved
   * references at ready-time keeps every teardown path working through the
   * detach.
   * @private
   */
  __readyMapboxMap?: MapboxMap;

  /**
   * The Mapbox `Map` instance resolved at ready-time, cached for teardown.
   * @private
   */
  __readyMap?: Map;

  /**
   * Off handler for a still-pending `map-load` subscription, flushed on destroy
   * so a child removed before the map finished loading leaves no listener behind.
   * @private
   */
  __offMapReady?: () => void;

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

  /**
   * Run a callback once the parent map is ready.
   *
   * Resolves the closest parent `MapboxMap`; if its map is already loaded the
   * callback runs synchronously, otherwise it runs once on the map's `map-load`.
   * The callback never fires after the child has been destroyed, and the
   * resolved map/`MapboxMap` are cached before it runs so teardown can reach
   * them even once the element is detached.
   *
   * @param {(map: Map) => void} cb The work to run against the ready map.
   */
  whenMapReady(cb: (map: Map) => void): void {
    const mapboxMap = this.$closest<MapboxMap>('MapboxMap');

    if (!mapboxMap) {
      this.$warn(
        'Can not find the parent map, does this component has a parent MapboxMap component?',
      );
      return;
    }

    const run = () => {
      // The child may have been destroyed while waiting for the map to load: do
      // not inject anything into a map the child no longer belongs to.
      if (!this.$isMounted) {
        return;
      }

      this.__readyMapboxMap = mapboxMap;
      this.__readyMap = mapboxMap.map;
      cb(this.__readyMap);
    };

    if (mapboxMap.isLoaded) {
      run();
    } else {
      this.__offMapReady = mapboxMap.$on(
        'map-load',
        () => {
          this.__offMapReady = undefined;
          run();
        },
        { once: true },
      );
    }
  }

  /**
   * Destroyed hook: flush any still-pending `map-load` subscription.
   *
   * Subclasses overriding `destroyed()` must call `super.destroyed()`.
   */
  destroyed() {
    this.__offMapReady?.();
    this.__offMapReady = undefined;
  }
}

export default AbstractMapboxMapChild;
