import type mapboxgl from 'mapbox-gl';

/**
 * The `mapbox-gl` default export namespace (`Map`, `Marker`, `Popup`, `LngLat`,
 * the `*Control` constructors, ...). This is the shape every component consumes,
 * whether it was injected with {@link provideMapboxGl} or resolved through the
 * fallback dynamic import.
 */
export type MapboxGl = typeof mapboxgl;

/**
 * Structural shape of the optional Mapbox geocoder control instances this
 * package builds. Declared locally so the optional `@mapbox/mapbox-gl-geocoder`
 * peer never leaks into the public type surface (and therefore never into the
 * emitted declarations), which would break consumers who install
 * `@studiometa/ui-mapbox` without the optional geocoder peer.
 */
export interface MapboxGeocoderControl {
  addTo(target: unknown): void;
  onRemove(): void;
  /**
   * Subscribe to a geocoder control event. Declared optional so the structural
   * type stays satisfiable by minimal test doubles and older control versions.
   */
  on?(type: string, callback: (event: { result: unknown }) => void): void;
}

/**
 * Structural constructor type for the optional Mapbox geocoder control, kept out
 * of the public peer type surface for the same reason as {@link MapboxGeocoderControl}.
 */
export interface MapboxGeocoderConstructor {
  new (options: Record<string, unknown>): MapboxGeocoderControl;
}

let mapboxGlInstance: MapboxGl | undefined;
let mapboxGlPromise: Promise<MapboxGl> | undefined;
let mapboxGlProvided = false;

let geocoderConstructor: MapboxGeocoderConstructor | undefined;
let geocoderPromise: Promise<MapboxGeocoderConstructor> | undefined;
let geocoderProvided = false;

/**
 * Inject the `mapbox-gl` module the components should use.
 *
 * Call once, before the components mount (e.g. right before `createApp`). Once
 * provided, `@studiometa/ui-mapbox` never imports `mapbox-gl` by specifier — it
 * uses this instance — so a host can supply its own build (a specific version, a
 * self-hosted worker for strict CSP, an import-map or CDN module).
 *
 * @param {MapboxGl} instance The `mapbox-gl` default export namespace.
 */
export function provideMapboxGl(instance: MapboxGl): void {
  mapboxGlProvided = true;
  mapboxGlInstance = instance;
  mapboxGlPromise = Promise.resolve(instance);
}

/**
 * Inject the optional Mapbox geocoder control constructor the `MapboxGeocoder`
 * component should use, so the optional `@mapbox/mapbox-gl-geocoder` peer is
 * never imported by specifier either.
 *
 * @param {MapboxGeocoderConstructor} constructor The geocoder control constructor.
 */
export function provideMapboxGeocoder(constructor: MapboxGeocoderConstructor): void {
  geocoderProvided = true;
  geocoderConstructor = constructor;
  geocoderPromise = Promise.resolve(constructor);
}

/**
 * Resolve the `mapbox-gl` namespace: the injected instance when one was provided
 * through {@link provideMapboxGl}, otherwise a lazily loaded `import('mapbox-gl')`.
 *
 * The result is memoized, so `mapbox-gl` loads at most once and repeated calls
 * are cheap. The resolved instance is also cached for {@link getMapboxGl}.
 *
 * @returns {Promise<MapboxGl>}
 */
export function resolveMapboxGl(): Promise<MapboxGl> {
  if (!mapboxGlPromise) {
    mapboxGlPromise = import('mapbox-gl').then((module) => {
      const instance = ((module as { default?: MapboxGl }).default ?? module) as MapboxGl;
      // A provideMapboxGl() call may have won the race while this import was in
      // flight: never let the fallback overwrite an injected instance. Returning
      // the authoritative instance also keeps callers that awaited this promise
      // before the injection consistent with the provided one.
      if (!mapboxGlProvided) {
        mapboxGlInstance = instance;
      }
      return mapboxGlInstance as MapboxGl;
    });
  }

  return mapboxGlPromise;
}

/**
 * Resolve the optional Mapbox geocoder control constructor: the injected one
 * when provided through {@link provideMapboxGeocoder}, otherwise a lazily loaded
 * `import('@mapbox/mapbox-gl-geocoder')`. Memoized like {@link resolveMapboxGl}.
 *
 * @returns {Promise<MapboxGeocoderConstructor>}
 */
export function resolveMapboxGeocoder(): Promise<MapboxGeocoderConstructor> {
  if (!geocoderPromise) {
    geocoderPromise = import('@mapbox/mapbox-gl-geocoder').then((module) => {
      // Cast through `unknown`: the peer's real constructor signature is narrower
      // than the structural `MapboxGeocoderConstructor` kept out of the public
      // type surface, so the two do not directly overlap.
      const constructor = (module as unknown as { default: MapboxGeocoderConstructor }).default;
      // Same race guard as resolveMapboxGl(): a provideMapboxGeocoder() call that
      // landed while this import was in flight must not be overwritten.
      if (!geocoderProvided) {
        geocoderConstructor = constructor;
      }
      return geocoderConstructor as MapboxGeocoderConstructor;
    });
  }

  return geocoderPromise;
}

/**
 * Synchronously read the resolved `mapbox-gl` namespace.
 *
 * Only valid after {@link resolveMapboxGl} (or {@link provideMapboxGl}) has run;
 * it throws otherwise. Components read it on synchronous hot paths (building a
 * control, marker, popup or `LngLat`) that are only ever reached once the map —
 * and therefore `mapbox-gl` — is ready.
 *
 * @returns {MapboxGl}
 */
export function getMapboxGl(): MapboxGl {
  if (!mapboxGlInstance) {
    throw new Error(
      '[@studiometa/ui-mapbox] mapbox-gl has not been resolved yet. Await resolveMapboxGl() (or call provideMapboxGl()) before reading it synchronously.',
    );
  }

  return mapboxGlInstance;
}
