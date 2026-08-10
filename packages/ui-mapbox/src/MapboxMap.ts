import { Base } from '@studiometa/js-toolkit/Base';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import type { Map, MapOptions } from 'mapbox-gl';
import { resolveMapboxGl } from './dependencies.js';
import { MAPBOX_MAP_CONNECTED } from './AbstractMapboxMapChild.js';

const FORWARDED_MAP_EVENTS = [
  'click',
  'dblclick',
  'mouseenter',
  'mouseleave',
  'mousemove',
  'movestart',
  'move',
  'moveend',
  'zoomstart',
  'zoom',
  'zoomend',
  'rotatestart',
  'rotate',
  'rotateend',
  'pitchstart',
  'pitch',
  'pitchend',
  'dragstart',
  'drag',
  'dragend',
  'idle',
  'render',
  'resize',
  'remove',
  'error',
] as const;

export interface MapboxMapProps extends BaseProps {
  $refs: {
    container: HTMLElement;
  };
  $options: {
    accessToken: string;
    zoom: number;
    center: [number, number];
    mapOptions: Partial<Omit<MapOptions, 'container'>>;
  };
}

/**
 * Display a Mapbox GL map.
 * @see https://ui.studiometa.dev/reference/items/MapboxMap/
 */
export class MapboxMap<T extends BaseProps = BaseProps> extends Base<T & MapboxMapProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'MapboxMap',
    emits: ['map-load', ...FORWARDED_MAP_EVENTS.map((event) => `map-${event}`)],
    refs: ['container'],
    options: {
      accessToken: String,
      zoom: Number,
      center: {
        type: Array,
        default: () => [0, 0],
      },
      // Any other `mapbox-gl` `Map` option — including `style`, `pitch`,
      // `bearing`, `bounds`, ... — spread as-is into the `Map` constructor. The
      // convenience options above act as overridable defaults, while `container`
      // is always resolved from the component and can not be overridden.
      mapOptions: {
        type: Object,
        default: () => ({}),
      },
    },
    // `MapboxMap` no longer declares its children. Each child component
    // (markers, popups, controls, sources, layers, clusters, ...) is registered
    // globally and resolves this map on its own via `$closest('MapboxMap')`,
    // then waits for readiness through `AbstractMapboxMapChild.whenMapReady`.
    // This makes the whole family dynamic-DOM-native: a child appended under a
    // map at any time mounts and injects itself, and cleans up when removed.
  };

  /**
   * Is the map loaded?
   */
  isLoaded = false;

  /**
   * Map instance, or `undefined` until it is built in `mounted()` and once it is
   * cleared on teardown.
   * @private
   */
  __map: Map | undefined;

  /**
   * Off handles for every forwarding listener attached to the map, flushed on
   * teardown so a retained reference to a removed `Map` does not keep this
   * component (and its `$emit` closures) alive.
   * @private
   */
  __offMapListeners: Array<() => void> = [];

  /**
   * The mapbox Map instance, or `undefined` until it has been built.
   *
   * The map is built in `mounted()` after `mapbox-gl` resolves (it may be
   * injected or lazily imported), so this getter returns `undefined` while that
   * resolution is still pending. Children read it after the map announces itself
   * through `MAPBOX_MAP_CONNECTED`, which only fires once the instance exists.
   */
  get map(): Map | undefined {
    return this.__map;
  }

  /**
   * Mounted hook.
   *
   * Resolves `mapbox-gl` (injected or lazily imported), builds the map, then
   * announces it so children can inject themselves.
   */
  async mounted() {
    const mapboxgl = await resolveMapboxGl();

    // The component may have been destroyed while `mapbox-gl` was resolving: bail
    // out before building a map that nothing would ever tear down.
    if (!this.$isMounted) {
      return;
    }

    const map = new mapboxgl.Map({
      accessToken: this.$options.accessToken,
      zoom: this.$options.zoom,
      center: this.$options.center,
      ...this.$options.mapOptions,
      container: this.$refs.container ?? this.$el,
    });
    this.__map = map;

    const onLoad = () => {
      this.isLoaded = true;
      this.$emit('map-load', map);
    };
    map.on('load', onLoad);
    this.__offMapListeners.push(() => this.__map?.off('load', onLoad));

    for (const event of FORWARDED_MAP_EVENTS) {
      const handler = (e: unknown) => {
        this.$emit(`map-${event}`, e);
      };
      map.on(event, handler);
      this.__offMapListeners.push(() => this.__map?.off(event, handler));
    }

    // Announce this map so any child that mounted before it — and is waiting on
    // `MAPBOX_MAP_CONNECTED` — can resolve and inject itself now. This also fires
    // on a remount, letting still-mounted children re-inject on the new map.
    document.dispatchEvent(new CustomEvent(MAPBOX_MAP_CONNECTED, { detail: this }));
  }

  /**
   * Destroyed hook.
   */
  destroyed() {
    // Flush the forwarding listeners before removing the map so neither the map
    // nor this component leaks through a retained `Map` reference.
    for (const off of this.__offMapListeners) {
      off();
    }
    this.__offMapListeners = [];

    this.__map?.remove();
    this.__map = undefined;
    this.isLoaded = false;
  }
}

export default MapboxMap;
