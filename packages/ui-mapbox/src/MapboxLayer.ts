import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import type { LayerSpecification, Map, MapSourceDataEvent } from 'mapbox-gl';
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
} from './AbstractMapboxMapChild.js';
import { claimMapboxOwnership, getMapboxOwner, releaseMapboxOwnership } from './utils.js';

export interface MapboxLayerProps extends AbstractMapboxMapChildProps {
  $options: {
    id: string;
    layer: LayerSpecification;
    beforeId: string;
  };
}

/**
 * Add a layer to the map.
 * @see https://ui.studiometa.dev/reference/items/MapboxMap/
 */
export class MapboxLayer<T extends BaseProps = BaseProps> extends AbstractMapboxMapChild<
  T & MapboxLayerProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'MapboxLayer',
    options: {
      id: String,
      layer: Object,
      beforeId: String,
    },
  };

  /**
   * Whether this instance owns the layer under its id. Only a layer this
   * instance owns may be removed on teardown; a layer declared outside the
   * family, or one a newer sibling has since adopted, is left untouched.
   * @private
   */
  __added = false;

  /**
   * The `kind:id` ownership key for this layer.
   * @private
   */
  get __ownershipKey(): string {
    return `layer:${this.$options.id}`;
  }

  /**
   * The source id this layer references, when it references one by string.
   * @private
   */
  get __sourceId(): string | undefined {
    const { source } = this.$options.layer as { source?: unknown };
    return typeof source === 'string' ? source : undefined;
  }

  /**
   * Add (or re-add) the layer whenever its referenced source becomes available
   * and the layer is not currently on the map.
   *
   * This is a *standing* recovery watch, not a one-shot: it stays subscribed for
   * the layer's whole life so the layer re-commits itself if its source
   * disappears and comes back — e.g. a sibling `MapboxSource` teardown removes
   * this still-mounted layer to drop its source, then the source is re-added
   * later (H7, PR #567 review). Committing once and unsubscribing (the previous
   * behaviour) left such a layer gone for good.
   *
   * It is kept cheap: `sourcedata` fires often, so the handler early-returns
   * unless this layer is actually missing, and — when the event identifies a
   * source — ignores events for any source other than this layer's. The commit
   * itself is deferred to a microtask because mutating the style from within
   * mapbox-gl's render loop can leave a layer half-initialized and crash the
   * symbol placement pass.
   * @private
   * @param {MapSourceDataEvent} [event]
   */
  __handleSourceData = (event?: MapSourceDataEvent) => {
    const map = this.__readyMap;
    const { id } = this.$options;

    // Ignore events for an unrelated source when the event tells us which one it
    // is: this gates the standing watch to this layer's source id.
    if (event?.sourceId && this.__sourceId && event.sourceId !== this.__sourceId) {
      return;
    }

    if (!map || map.getLayer(id) || !this.__sourceIsAvailable(map)) {
      return;
    }

    queueMicrotask(() => {
      // Re-check under the microtask: the map may have been removed/replaced, the
      // component destroyed, or the layer committed by another path in between.
      if (this.$isMounted && this.__readyMap === map && !map.getLayer(id)) {
        this.__commitLayer(map);
      }
    });
  };

  /**
   * Add the layer to the map, or adopt an existing one.
   *
   * When the id is free the layer is added and ownership claimed. When a layer
   * with this id already exists, re-adding it would throw a duplicate-id error,
   * so it is left in place; ownership is only taken over from a sibling
   * `MapboxLayer` (e.g. a `Fetch` swap), never from an externally declared layer.
   * @private
   * @param {Map} map
   */
  __commitLayer(map: Map): void {
    const { beforeId, id, layer } = this.$options;
    // `$options.layer` returns a freshly parsed object, so re-apply the id.
    layer.id = id;

    if (map.getLayer(id)) {
      // The id is taken. Only adopt it from another family instance (e.g. a
      // `Fetch` swap that mounted the replacement before the original tore
      // down); an externally declared layer stays untouched. Adopt AND refresh:
      // the incoming definition may differ in source/type/paint/layout/filter/
      // zoom range/beforeId, so re-add it (we own it) rather than leaving Mapbox
      // rendering the outgoing definition — matching how `MapboxSource` refreshes
      // its data on adopt.
      if (getMapboxOwner(map, this.__ownershipKey)) {
        map.removeLayer(id);
        map.addLayer(layer, beforeId);
        const added = map.getLayer(id);
        claimMapboxOwnership(map, this.__ownershipKey, this, () => map.getLayer(id) === added);
        this.__added = true;
      }
      return;
    }

    map.addLayer(layer, beforeId);
    // Own the id, keyed to the very layer object just added: the liveness probe
    // reports the entry stale the moment this layer is removed (a `setStyle`
    // wipe, a sibling source teardown, an external `removeLayer`) or replaced
    // under the same id, so it can never misclassify a stranger's later layer.
    const added = map.getLayer(id);
    claimMapboxOwnership(map, this.__ownershipKey, this, () => map.getLayer(id) === added);
    this.__added = true;
  }

  /**
   * Whether the source referenced by the layer is available on the map.
   *
   * Layers referencing an inline source object — or no source at all, like a
   * `background` layer — are always considered available.
   * @private
   * @param   {Map} map
   * @returns {boolean}
   */
  __sourceIsAvailable(map: Map): boolean {
    const { source } = this.$options.layer as { source?: unknown };
    return typeof source !== 'string' || Boolean(map.getSource(source));
  }

  /**
   * Mounted hook.
   */
  mounted() {
    this.whenMapReady((map) => {
      // Install (or re-install, on a `style.load` re-injection) the standing
      // recovery watch exactly once. `off` before `on` keeps a single
      // subscription when `whenMapReady`'s callback re-runs after a `setStyle`.
      map.off('sourcedata', this.__handleSourceData);
      map.on('sourcedata', this.__handleSourceData);

      // The referenced source may be declared by a sibling `MapboxSource` that
      // has not mounted yet — sibling mount order is not guaranteed. Adding a
      // layer before its source silently fails, so commit now when the source is
      // available and otherwise let the standing watch commit once it arrives.
      if (this.__sourceIsAvailable(map)) {
        this.__commitLayer(map);
      }
    });
  }

  /**
   * Flush the standing `sourcedata` recovery watch against the map being
   * removed, while it is still referenceable — `__onDestroyed` runs later with
   * `__readyMap` already cleared and could not reach the map to unsubscribe.
   * @protected
   * @param {Map} map
   */
  __onMapRemove(map: Map) {
    map.off('sourcedata', this.__handleSourceData);
  }

  /**
   * Teardown hook.
   */
  __onDestroyed() {
    const map = this.__readyMap;
    const { id } = this.$options;

    map?.off('sourcedata', this.__handleSourceData);

    // Only remove a layer this instance still owns: a newer sibling may have
    // adopted the id, and a removed map is already gone (`__readyMap` is unset).
    if (
      this.__added &&
      getMapboxOwner(map as object, this.__ownershipKey) === this &&
      map?.getLayer(id)
    ) {
      map.removeLayer(id);
      releaseMapboxOwnership(map, this.__ownershipKey, this);
    }
  }
}

export default MapboxLayer;
