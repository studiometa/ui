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
 * Load and register a single image against the map sprite.
 *
 * The image is only added when it is not already registered to avoid the
 * "An image with this name already exists" error thrown by Mapbox.
 *
 * @param   {Map}                   map        The Mapbox map instance.
 * @param   {MapboxImageDefinition} definition The image definition to register.
 * @returns {Promise<MapboxImage>}
 */
export async function addMapboxImage(
  map: Map,
  { name, url, options }: MapboxImageDefinition,
): Promise<MapboxImage> {
  const image = await loadMapboxImage(map, url);

  if (!map.hasImage(name)) {
    map.addImage(name, image, options);
  }

  return image;
}

/**
 * Wrap a `MapboxMap` child component into an async constructor that resolves
 * only once the parent Mapbox map instance has finished loading.
 *
 * js-toolkit calls the returned function with the parent `Base` instance (here
 * the `MapboxMap`) and awaits the returned promise before mounting the child,
 * which guarantees the child can safely access the fully loaded map.
 *
 * @param   {T} Component The child component constructor to resolve.
 * @returns {(mapboxMap: MapboxMap) => Promise<T>}
 */
export function resolveWhenMapboxMapIsLoaded<T extends BaseConstructor>(Component: T) {
  return (mapboxMap: MapboxMap): Promise<T> =>
    new Promise((resolve) => {
      if (mapboxMap.isLoaded) {
        resolve(Component);
      } else {
        mapboxMap.$on(
          'map-load',
          () => {
            resolve(Component);
          },
          { once: true },
        );
      }
    });
}
