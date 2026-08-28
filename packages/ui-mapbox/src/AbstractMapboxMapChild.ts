import { Base } from '@studiometa/js-toolkit/Base';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import type { Map } from 'mapbox-gl';
import type { MapboxMap } from './MapboxMap.js';

export interface AbstractMapboxMapChildProps extends BaseProps {
  /**
   * The one event every map child can emit, declared in the props type now
   * that v4 removed the runtime `config.emits` list.
   *
   * v3 emitted the bare error value; v4 carries one named payload object per
   * event, so the cause travels as `detail.error`.
   */
  $emits: {
    'map-error': { error: unknown };
  };
}

/**
 * Document-level event a `MapboxMap` dispatches when its instance mounts, so a
 * child that mounted *before* its map (e.g. an eagerly registered child under a
 * lazily imported map) can retry resolving its parent and inject itself once the
 * map is connected. The dispatching `MapboxMap` instance travels in `detail`.
 */
export const MAPBOX_MAP_CONNECTED = 'mapbox-map:connected';

/**
 * Base class for every component living inside a `MapboxMap`.
 *
 * Children are self-sufficient and dynamic-DOM-native: they resolve their
 * parent `MapboxMap` on their own via `$closest`, wait for the map to be ready
 * with `whenMapReady`, then inject their contribution. Each component is
 * registered independently (e.g. with `registerComponent`, optionally behind a
 * lazy `importWhen*` helper); registration order does not matter because a child
 * resolves its map through the connected-event retry. Once registered,
 * js-toolkit's document-wide `MutationObserver` mounts them whenever their
 * element enters the DOM —
 * statically, `Fetch`-injected or `appendChild`-ed — and terminates them when it
 * leaves, at which point they remove their contribution again.
 *
 * The base hardens three things every child inherits, rather than relying on
 * per-subclass discipline:
 *
 * 1. **Guarded injection & teardown** — mapbox-gl throws readily (a duplicate
 *    source id, any style-touching call after `map.remove()`), and js-toolkit's
 *    global queue runs lifecycle hooks with no try/catch: a single synchronous
 *    throw wedges the queue and freezes every mount/destroy on the page. The
 *    ready callback and the subclass teardown (`__onDestroyed`) are both run
 *    inside a try/catch that routes to `$warn` + a `map-error` event and never
 *    rethrows.
 * 2. **Dead-map safety** — once ready, the child subscribes to the map's own
 *    `remove` event; when it fires the cached map reference is dropped so no
 *    teardown ever calls a method on a removed map (which throws `TypeError`).
 * 3. **Retryable, standing resolution** — resolution is not one-shot: a child
 *    with no map yet waits for `MAPBOX_MAP_CONNECTED`, and a map destroy →
 *    remount re-injects the child on the new map's next load.
 * 4. **Style-reload re-injection** — a `map.setStyle()` wipes the whole style
 *    (every source/layer/sprite) while the map instance and the still-mounted
 *    children survive, so the declarative resources would silently vanish. Once
 *    ready, the child subscribes to the map's `style.load` — fired once per
 *    style load, the Mapbox-recommended hook for re-adding custom sources/layers
 *    when switching base style — and re-runs its injection so it re-adds its
 *    contribution onto the fresh style (H7, PR #567 review). The re-run reuses
 *    the same containment as the first injection and is guarded on the resource
 *    already being present, so it never double-injects.
 *
 * @see https://ui.studiometa.dev/reference/items/MapboxMap/
 */
export class AbstractMapboxMapChild<T extends BaseProps = BaseProps> extends Base<
  T & AbstractMapboxMapChildProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'AbstractMapboxMapChild',
  };

  /**
   * The parent `MapboxMap` resolved at ready-time.
   *
   * `unmounted()` runs *after* the element has been detached from the DOM (e.g.
   * a `Fetch` list swap, or the parent map itself being removed), and a
   * `$closest` lookup on a disconnected node returns nothing — a real bug that
   * would leave the child's contribution stuck on the map. Caching the resolved
   * references at ready-time keeps every teardown path working through the
   * detach.
   * @private
   */
  __readyMapboxMap?: MapboxMap;

  /**
   * The Mapbox `Map` instance resolved at ready-time, cached for teardown. It is
   * dropped as soon as the map's `remove` event fires so teardown never touches
   * a removed map.
   * @private
   */
  __readyMap?: Map;

  /**
   * The injection callback registered through `whenMapReady`, kept so it can be
   * re-run against a new map when the current one is destroyed and remounted.
   *
   * The callback may be synchronous or `async`: a returned promise is awaited
   * inside the same containment as a synchronous body, so a rejection routes to
   * `$warn` + the `map-error` event instead of surfacing as an unhandled rejection.
   * @private
   */
  __readyCallback?: (map: Map) => void | Promise<void>;

  /**
   * Off handler for a still-pending `map-load` subscription, flushed on destroy
   * so a child removed before the map finished loading leaves no listener behind.
   * @private
   */
  __offMapReady?: () => void;

  /**
   * Off handler for the ready map's `remove` subscription.
   * @private
   */
  __offMapRemove?: () => void;

  /**
   * Off handler for the ready map's `style.load` re-injection subscription.
   * @private
   */
  __offStyleReload?: () => void;

  /**
   * Off handler for the document-level `MAPBOX_MAP_CONNECTED` retry subscription.
   * @private
   */
  __offConnected?: () => void;

  /**
   * The closest parent `MapboxMap` component instance.
   */
  get mapboxMap() {
    const mapboxMap = this.$closest<MapboxMap>('MapboxMap');

    if (!mapboxMap) {
      this.$warn(
        'mapbox-map-child.orphan',
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
   * Run a callback once the parent map is ready — now, on the next `map-load`,
   * or once a `MapboxMap` connects if none exists yet.
   *
   * The callback is stored so it can be re-run on a fresh map after a destroy →
   * remount. It is wrapped so a throw never propagates into the global queue, is
   * never fired after the child has been destroyed, and the resolved
   * map/`MapboxMap` are cached before it runs so teardown can reach them even
   * once the element is detached.
   *
   * The callback may be `async`: a subclass that awaits (image loading, cluster
   * expansion, ...) must additionally guard against the map changing under it by
   * checking `this.__readyMap === map` after every `await`, since the map it was
   * handed can be removed — or replaced by another — while the promise is in
   * flight. A rejected promise is contained here, never rethrown.
   *
   * @param {(map: Map) => void | Promise<void>} cb The work to run against the ready map.
   */
  whenMapReady(cb: (map: Map) => void | Promise<void>): void {
    this.__readyCallback = cb;
    this.__resolveMap();
  }

  /**
   * Resolve the parent `MapboxMap` and bind to it, or wait for one to connect.
   * @private
   */
  __resolveMap(): void {
    const mapboxMap = this.$closest<MapboxMap>('MapboxMap');

    if (!mapboxMap) {
      this.__waitForConnectedMap();
      return;
    }

    this.__bindToMap(mapboxMap);
  }

  /**
   * Subscribe once to `MAPBOX_MAP_CONNECTED` and retry resolution when a map
   * whose element is an ancestor of this child connects.
   * @private
   */
  __waitForConnectedMap(): void {
    if (this.__offConnected) {
      return;
    }

    const handler = (event: Event) => {
      const mapboxMap = (event as CustomEvent<MapboxMap>).detail;

      // Ignore maps that are not an ancestor of this child: several independent
      // maps can live on the same page.
      if (!mapboxMap?.$el?.contains(this.$el)) {
        return;
      }

      this.__offConnected?.();
      this.__offConnected = undefined;
      this.__resolveMap();
    };

    document.addEventListener(MAPBOX_MAP_CONNECTED, handler);
    this.__offConnected = () => document.removeEventListener(MAPBOX_MAP_CONNECTED, handler);
  }

  /**
   * Bind to a resolved `MapboxMap`: run the ready callback now if its map is
   * already loaded, otherwise once on `map-load`.
   * @private
   * @param {MapboxMap} mapboxMap
   */
  __bindToMap(mapboxMap: MapboxMap): void {
    // Resolve the concrete map now and subscribe to its `remove` immediately.
    // Binding the remove handler here rather than after load means a map removed
    // *while its load is still pending* re-resolves the child onto a replacement
    // instead of stranding it: the pending `map-load` subscription is flushed and
    // the child parks on `MAPBOX_MAP_CONNECTED` again.
    const map = mapboxMap.map;

    // The parent's `MapboxMap` instance may exist while its concrete map is not
    // built yet: it resolves `mapbox-gl` asynchronously in `mounted()` before
    // creating the map. Keep waiting on `MAPBOX_MAP_CONNECTED`, which the map
    // dispatches once its instance exists, and bind then.
    if (!map) {
      this.__waitForConnectedMap();
      return;
    }

    // Drop any stale pending subscription before (re)binding.
    this.__offMapReady?.();
    this.__offMapReady = undefined;

    this.__bindMapRemove(map);
    this.__bindStyleReload(map);

    const run = () => {
      // The child may have been destroyed while waiting for the map to load: do
      // not inject anything into a map the child no longer belongs to.
      if (!this.$isMounted) {
        return;
      }

      this.__readyMapboxMap = mapboxMap;
      this.__readyMap = map;
      this.__runReadyCallback(map);
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
   * Run the ready callback inside a uniform containment for both synchronous
   * throws and rejected promises: a synchronous body is wrapped in `try/catch`,
   * and an `async` body's returned promise is awaited so its rejection routes to
   * `$warn` + the `map-error` event instead of becoming an unhandled rejection.
   * Neither path ever rethrows into the global lifecycle queue.
   * @private
   * @param {Map} map
   */
  __runReadyCallback(map: Map): void {
    let result: void | Promise<void>;

    try {
      result = this.__readyCallback?.(map);
    } catch (err) {
      this.__handleError(err);
      return;
    }

    if (result && typeof (result as Promise<void>).then === 'function') {
      Promise.resolve(result).catch((err) => this.__handleError(err));
    }
  }

  /**
   * Subscribe once to the map's own `remove` event so teardown never runs
   * against a removed map, and so the child re-injects on a remounted map.
   * @private
   * @param {Map} map
   */
  __bindMapRemove(map: Map): void {
    this.__offMapRemove?.();
    this.__offMapRemove = undefined;

    // Degrade gracefully for minimal map doubles without an event emitter: a
    // real mapbox map always exposes `on`/`off`.
    if (typeof map?.on !== 'function') {
      return;
    }

    const handler = () => {
      this.__offMapRemove?.();
      this.__offMapRemove = undefined;

      // Let the subclass flush any map-scoped listener while the map is still
      // referenceable: once `__readyMap` is cleared its teardown can no longer
      // reach the map to `off` them.
      try {
        this.__onMapRemove(map);
      } catch (err) {
        this.__handleError(err);
      }

      // A map removed before it finished loading still has a pending `map-load`
      // subscription on the (now dead) `MapboxMap`: flush it so the child does
      // not try to bind on a load that will never come.
      this.__offMapReady?.();
      this.__offMapReady = undefined;
      // The style-reload watch was bound to the now-dead map: drop it too so no
      // `style.load` re-injection ever fires against a removed map.
      this.__offStyleReload?.();
      this.__offStyleReload = undefined;
      this.__readyMap = undefined;
      this.__readyMapboxMap = undefined;

      // The map went away, not the child: wait for a new one to connect and
      // re-run the injection against it.
      if (this.$isMounted && this.__readyCallback) {
        this.__waitForConnectedMap();
      }
    };

    map.on('remove', handler);
    this.__offMapRemove = () => map.off('remove', handler);
  }

  /**
   * Subscribe to the map's `style.load` so the child re-runs its injection after
   * a `setStyle` replaces the whole style, re-adding the source/layer/sprite it
   * would otherwise have silently lost.
   *
   * `style.load` fires once per style load — Mapbox's own recommended hook for
   * re-adding custom sources and layers when switching base style — so it does
   * not need the `styledata` de-duplication a broader `styledata` handler would.
   * The handler bails until the child has actually finished its first injection
   * on this map (`__readyMap === map`): at the *initial* style load `__readyMap`
   * is not set yet (the first injection runs on `map-load`), so this never
   * double-injects on mount and only re-injects on a genuine later `setStyle`.
   * @private
   * @param {Map} map
   */
  __bindStyleReload(map: Map): void {
    this.__offStyleReload?.();
    this.__offStyleReload = undefined;

    // Degrade gracefully for minimal map doubles without an event emitter.
    if (typeof map?.on !== 'function') {
      return;
    }

    const handler = () => {
      // Only re-inject once the first injection has run against this very map,
      // and only while still mounted with work to do. Re-runs against a map the
      // child no longer owns (removed/replaced) are the `remove` path's job.
      if (!this.$isMounted || !this.__readyCallback || this.__readyMap !== map) {
        return;
      }

      // Reuse the first-injection containment. Each subclass callback guards on
      // whether its resource is already present (`getSource`/`getLayer`/
      // `hasImage`), so re-running is safe and re-claims ownership with a fresh
      // liveness probe against the new style.
      this.__runReadyCallback(map);
    };

    map.on('style.load', handler);
    this.__offStyleReload = () => map.off('style.load', handler);
  }

  /**
   * Contain an error raised by a guarded injection or teardown: warn and emit an
   * `map-error` event, but never rethrow into the global queue.
   * @private
   * @param {unknown} err
   */
  __handleError(err: unknown): void {
    this.$error('mapbox-map-child.failed', 'A guarded map injection or teardown threw.', err);
    this.$emit('map-error', { error: err });
  }

  /**
   * Hook run when the ready map fires its own `remove` event, while the map is
   * still referenceable (before `__readyMap` is cleared).
   *
   * Subclasses that attach map-scoped listeners (a layer waiting on
   * `sourcedata`, a cluster's per-layer click/hover handlers) override this to
   * `off` them against the map they were bound to — the removed map — since
   * their `__onDestroyed` runs later with `__readyMap` already `undefined` and
   * could not reach the map to unsubscribe.
   * @protected
   * @param {Map} _map The map being removed.
   */
  __onMapRemove(_map: Map) {}

  /**
   * Teardown hook implemented by subclasses instead of `unmounted()`.
   *
   * It runs inside the base's guard (see `unmounted`) so a throwing teardown — a
   * style-touching mapbox call, most often — can never wedge the global queue.
   * Implementations read the cached `__readyMap`, which is already `undefined`
   * when the map has been removed, and must not call `super`.
   * @protected
   */
  __onDestroyed() {}

  /**
   * Unmounted hook.
   *
   * Runs the guarded subclass teardown, then flushes every base subscription
   * (`map-load`, the map's `remove`, the connected retry). Subclasses override
   * `__onDestroyed` rather than this method.
   */
  unmounted() {
    try {
      this.__onDestroyed();
    } catch (err) {
      this.__handleError(err);
    }

    this.__offMapReady?.();
    this.__offMapReady = undefined;
    this.__offMapRemove?.();
    this.__offMapRemove = undefined;
    this.__offStyleReload?.();
    this.__offStyleReload = undefined;
    this.__offConnected?.();
    this.__offConnected = undefined;
    this.__readyCallback = undefined;
  }
}

export default AbstractMapboxMapChild;
