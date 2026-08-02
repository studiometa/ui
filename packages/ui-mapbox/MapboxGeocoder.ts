import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import mapboxgl from 'mapbox-gl';
import type { Map, IControl } from 'mapbox-gl';
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
} from './AbstractMapboxMapChild.js';

/**
 * Minimal structural shape of the optional Mapbox geocoder control used by this
 * component. It is declared locally so the optional geocoder peer dependency
 * never appears in the public type surface — and therefore never in the emitted
 * declarations — which would otherwise break consumers who install
 * `@studiometa/ui-mapbox` without the optional geocoder peer installed.
 */
interface GeocoderControlLike {
  addTo(target: Map | HTMLElement | string): void;
  onRemove(): void;
  /**
   * Subscribe to a geocoder control event. Declared optional so the structural
   * type stays satisfiable by minimal test doubles and older control versions.
   */
  on?(type: string, callback: (event: { result: unknown }) => void): void;
}

export interface MapboxGeocoderProps extends AbstractMapboxMapChildProps {
  $options: {
    /**
     * Wether to add the geocoder to the map or to the component's root element.
     */
    addToMap: boolean;
    /**
     * All MapboxGeocoder options, except the non serializable ones.
     *
     * Typed structurally (rather than with the optional geocoder peer types) to
     * keep the peer out of the public type surface. Refer to the Mapbox geocoder
     * package documentation (API.md#parameters) for the accepted options.
     */
    options: Record<string, unknown>;
  };
}

/**
 * Add a geocoder control to the map.
 *
 * The Mapbox geocoder module is an optional peer dependency and is loaded on
 * demand with a dynamic `import()` when the component mounts, so the rest of the
 * package keeps working without it installed.
 *
 * @see https://ui.studiometa.dev/reference/items/MapboxMap/
 */
export class MapboxGeocoder<T extends BaseProps = BaseProps> extends AbstractMapboxMapChild<
  T & MapboxGeocoderProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'MapboxGeocoder',
    emits: ['result'],
    options: {
      addToMap: Boolean,
      options: Object,
    },
  };

  /**
   * Control instance, created once the lazily imported module resolves.
   * @private
   */
  __control?: GeocoderControlLike;

  /**
   * The Mapbox geocoder control instance, if it has been created yet.
   */
  get control(): GeocoderControlLike | undefined {
    return this.__control;
  }

  /**
   * Target element the geocoder is added to: the map when `addToMap` is set,
   * otherwise the component's own root element.
   */
  get target(): Map | HTMLElement | string {
    return this.$options.addToMap ? this.map : this.$el;
  }

  /**
   * Mounted hook.
   *
   * Lazily loads the optional Mapbox geocoder module, then builds and adds the
   * control once the parent map is ready.
   */
  async mounted() {
    const { default: GeocoderControlClass } = await import('@mapbox/mapbox-gl-geocoder');

    // The component may have been destroyed while the dynamic import was still
    // resolving. Bail out before creating and adding the control, otherwise it
    // would be attached after `destroyed()` already ran (and saw `__control`
    // undefined), leaking an orphan control.
    if (!this.$isMounted) {
      return;
    }

    this.whenMapReady(() => {
      // The ready callback is standing: it re-runs on every map replacement. An
      // element-targeted control (`addToMap` false) lives on `$el`, which
      // survives the map swap, so a previous control must be removed first or
      // each replacement would stack another geocoder onto the element. A
      // map-targeted control went away with its (removed) map, so only its
      // reference needs dropping.
      if (this.__control) {
        if (!this.$options.addToMap) {
          this.__control.onRemove();
        }
        this.__control = undefined;
      }

      const options = {
        ...this.$options.options,
        mapboxgl: mapboxgl as unknown as typeof import('mapbox-gl'),
        accessToken:
          this.$options.options.accessToken ?? this.__readyMapboxMap?.$options.accessToken,
      };
      this.__control = new GeocoderControlClass(
        options as ConstructorParameters<typeof GeocoderControlClass>[0],
      );
      // Re-emit the control's `result` event as a component event so consumers
      // (e.g. a `MapboxCluster`) can react to a geocoded address.
      this.__control.on?.('result', (event) => this.$emit('result', event.result));
      this.__control.addTo(this.target);
    });
  }

  /**
   * Teardown hook.
   */
  __onDestroyed() {
    // The control may not exist yet: the dynamic import in `mounted()` might not
    // have resolved, or the geocoder module was never loaded.
    if (this.__control) {
      if (this.$options.addToMap) {
        this.__readyMap?.removeControl(this.__control as unknown as IControl);
      } else {
        this.__control.onRemove();
      }
      this.__control = undefined;
    }
  }
}

export default MapboxGeocoder;
