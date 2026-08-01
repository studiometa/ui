import type { BaseConstructor } from '@studiometa/js-toolkit';
import type { Map } from 'mapbox-gl';
import type { MapboxMap } from './MapboxMap.js';

/**
 * The kind of image the Mapbox `loadImage` method resolves with.
 */
export type MapboxImage = ImageBitmap | HTMLImageElement | ImageData;

/**
 * The options accepted by the Mapbox `addImage` method.
 *
 * Derived from the method signature as the underlying `StyleImageMetadata`
 * type is not part of the public `mapbox-gl` exports.
 */
export type MapboxImageOptions = NonNullable<Parameters<Map['addImage']>[2]>;

/**
 * Describe a single image to register against a map sprite.
 */
export interface MapboxImageDefinition {
  /**
   * The id of the image once registered in the map sprite.
   */
  name: string;
  /**
   * The URL of the image file, must be in png, webp or jpg format.
   */
  url: string;
  /**
   * The image options forwarded to `map.addImage`.
   */
  options?: MapboxImageOptions;
}

/**
 * Load an image from an external URL with the Mapbox `loadImage` method.
 *
 * The installed `mapbox-gl` version still exposes a callback based
 * `loadImage`, so we wrap it into a promise to keep the components async.
 *
 * @param   {Map}    map The Mapbox map instance.
 * @param   {string} url The URL of the image to load.
 * @returns {Promise<MapboxImage>}
 */
export function loadMapboxImage(map: Map, url: string): Promise<MapboxImage> {
  return new Promise((resolve, reject) => {
    map.loadImage(url, (error, image) => {
      if (error || !image) {
        reject(error ?? new Error(`Failed to load the image at "${url}".`));
        return;
      }

      resolve(image);
    });
  });
}

/**
 * The result of registering an image against a map sprite.
 */
export interface AddMapboxImageResult {
  /**
   * The image loaded from the URL.
   */
  image: MapboxImage;
  /**
   * Whether this call actually added the image to the map sprite. It is `false`
   * when the sprite already existed (registered by someone else), signalling to
   * callers that they do not own it and must not remove it on teardown.
   */
  added: boolean;
}

/**
 * Load and register a single image against the map sprite.
 *
 * The image is only added when it is not already registered to avoid the
 * "An image with this name already exists" error thrown by Mapbox. The returned
 * `added` flag reports whether this call owns the sprite so callers can restrict
 * teardown to the sprites they actually added.
 *
 * @param   {Map}                   map        The Mapbox map instance.
 * @param   {MapboxImageDefinition} definition The image definition to register.
 * @returns {Promise<AddMapboxImageResult>}
 */
export async function addMapboxImage(
  map: Map,
  { name, url, options }: MapboxImageDefinition,
): Promise<AddMapboxImageResult> {
  const image = await loadMapboxImage(map, url);

  let added = false;
  if (!map.hasImage(name)) {
    map.addImage(name, image, options);
    added = true;
  }

  return { image, added };
}

/**
 * A lazy loader for a `MapboxMap` child component constructor.
 *
 * It may return the constructor directly, a module namespace exposing it as the
 * `default` export, or a promise of either — the latter enabling a code-split
 * `() => import('./MapboxChild.js').then((m) => m.MapboxChild)` so the child's
 * chunk is fetched only when a matching element exists on the page.
 */
export type MapboxMapChildLoader<T extends BaseConstructor> = () =>
  | T
  | { default: T }
  | Promise<T | { default: T }>;

/**
 * Normalize a resolved loader value — a constructor or a `{ default }` module
 * namespace — down to the bare constructor.
 *
 * @param   {T | { default: T }} module The value a loader resolved with.
 * @returns {T}
 */
function toConstructor<T extends BaseConstructor>(module: T | { default: T }): T {
  return (module as { default?: T }).default ?? (module as T);
}

/**
 * Wrap a `MapboxMap` child component into an async constructor that resolves
 * only once the parent Mapbox map instance has finished loading.
 *
 * js-toolkit calls the returned function with the parent `Base` instance (here
 * the `MapboxMap`) and awaits the returned promise before mounting the child,
 * which guarantees the child can safely access the fully loaded map.
 *
 * The argument is either:
 *
 * - a `Base` constructor (detected through its static `$isBase` flag), kept for
 *   backward compatibility with callers still passing a class directly; or
 * - a {@link MapboxMapChildLoader} factory, invoked **after** the map has loaded
 *   so a `() => import(...)` only fetches the child's chunk once js-toolkit has
 *   found a matching element AND the map is ready.
 *
 * @param   {T | MapboxMapChildLoader<T>} componentOrLoader The child constructor or its lazy loader.
 * @returns {(mapboxMap: MapboxMap) => Promise<T>}
 */
export function resolveWhenMapboxMapIsLoaded<T extends BaseConstructor>(
  componentOrLoader: T | MapboxMapChildLoader<T>,
) {
  // A `Base` constructor carries the static `$isBase` flag; anything else is
  // treated as a loader factory. This keeps the historical "pass a class"
  // signature working while enabling the lazy `() => import(...)` form.
  const loader: MapboxMapChildLoader<T> =
    '$isBase' in componentOrLoader ? () => componentOrLoader : componentOrLoader;

  return (mapboxMap: MapboxMap): Promise<T> =>
    new Promise((resolve) => {
      // Invoke the loader (and await its dynamic import, if any) only once the
      // map has loaded, then hand js-toolkit the resolved constructor.
      function resolveComponent() {
        resolve(Promise.resolve(loader()).then(toConstructor));
      }

      if (mapboxMap.isLoaded) {
        resolveComponent();
      } else {
        mapboxMap.$on('map-load', resolveComponent, { once: true });
      }
    });
}
