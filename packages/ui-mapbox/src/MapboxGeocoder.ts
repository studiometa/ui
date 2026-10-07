import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { selectorFor } from '@studiometa/js-toolkit/utils/selectorFor';
import type { Map, IControl } from 'mapbox-gl';
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
} from './AbstractMapboxMapChild.js';
import { getMapboxGl, resolveMapboxGeocoder, type MapboxGeocoderControl } from './dependencies.js';

export interface MapboxGeocoderProps extends AbstractMapboxMapChildProps {
  $options: {
    /**
     * Wether to add the geocoder to the parent map or to the component's root
     * element. Requires a parent `MapboxMap`.
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
  /**
   * The geocoder's own event, declared in the props type. The geocoded result
   * travels as `detail.result`.
   */
  $emits: AbstractMapboxMapChildProps['$emits'] & {
    'map-result': { result: unknown };
  };
}

/**
 * Add a geocoder control to the map, or to the component's root element.
 *
 * Inside a `MapboxMap`, the control waits for the map and falls back to the
 * map's `accessToken`. Only a control added to the map (`addToMap`) shows a
 * marker for the picked result: the geocoder library skips the marker when it is
 * rendered in an element. Without a parent map (and without `addToMap`), it works
 * on its own: it renders in the root element as soon as it mounts, needs
 * `options.accessToken`, and never loads `mapbox-gl`.
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
    mountStrategy: 'visible',
    options: {
      addToMap: Boolean,
      options: Object,
    },
  };

  /**
   * Control instance, created once the lazily imported module resolves.
   * @private
   */
  __control?: MapboxGeocoderControl;

  /**
   * The Mapbox geocoder control instance, if it has been created yet.
   */
  get control(): MapboxGeocoderControl | undefined {
    return this.__control;
  }

  /**
   * Target element the geocoder is added to: the parent map when `addToMap` is
   * set, otherwise the component's own root element.
   */
  get target(): Map | HTMLElement | string {
    return this.$options.addToMap ? this.map : this.$el;
  }

  /**
   * Mounted hook.
   *
   * Lazily loads the optional Mapbox geocoder module, then builds and adds the
   * control: once the parent map is ready, or right away without a parent map.
   */
  async mounted() {
    // Look for the parent map element rather than a mounted `MapboxMap`
    // instance: a lazily mounted map has no instance yet, and the geocoder must
    // wait for it instead of going standalone.
    const standalone =
      !this.$options.addToMap && !this.$el.parentElement?.closest(selectorFor('MapboxMap'));

    if (standalone && !this.$options.options.accessToken) {
      this.$warn(
        'mapbox-geocoder.missing-access-token',
        'Can not create the geocoder without a parent MapboxMap: set the `accessToken` in its `options`.',
      );
      return;
    }

    const GeocoderControlClass = await resolveMapboxGeocoder();

    // The component may have been destroyed while the dynamic import was still
    // resolving. Bail out before creating and adding the control, otherwise it
    // would be attached after `__onDestroyed()` already ran (and saw `__control`
    // undefined), leaking an orphan control.
    if (!this.$isMounted) {
      return;
    }

    if (standalone) {
      // Contain a throw like the map path does: without it, it would surface as
      // an unhandled rejection of `mounted()` with no `map-error` event.
      try {
        this.__addControl(new GeocoderControlClass(this.$options.options));
      } catch (err) {
        this.__handleError(err);
      }
      return;
    }

    // The ready callback is standing: it re-runs on every map replacement.
    this.whenMapReady(() => {
      this.__addControl(
        new GeocoderControlClass({
          ...this.$options.options,
          mapboxgl: getMapboxGl(),
          accessToken:
            this.$options.options.accessToken ?? this.__readyMapboxMap?.$options.accessToken,
        }),
      );
    });
  }

  /**
   * Add a control to the target, replacing the previous one, and re-emit its
   * `result` event as a prefixed component event, so consumers (e.g. a
   * `StoreLocator`) can react to a geocoded address.
   *
   * A previous control exists when the map is replaced (the ready callback
   * re-runs) or when the instance is unmounted and mounted again while the
   * geocoder import is pending (both `mounted()` calls resume). An
   * element-targeted control (`addToMap` false) lives on `$el`, which survives
   * both, so it must be removed first or the element would stack several
   * geocoders. A map-targeted control went away with its (removed) map, so only
   * its reference needs dropping.
   * @private
   * @param {MapboxGeocoderControl} control
   */
  __addControl(control: MapboxGeocoderControl) {
    if (this.__control) {
      if (!this.$options.addToMap) {
        this.__control.onRemove();
      }
      this.__control = undefined;
    }

    control.on?.('result', (event) => this.$emit('map-result', { result: event.result }));
    control.addTo(this.target);
    // Keep the control only once it is added: teardown calls `onRemove()` on it,
    // which throws on a control that never rendered.
    this.__control = control;
  }

  /**
   * Teardown hook.
   */
  __onDestroyed() {
    // The control may not exist yet: the dynamic import in `mounted()` might not
    // have resolved, the geocoder module was never loaded, or a geocoder without
    // a parent map had no access token.
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
