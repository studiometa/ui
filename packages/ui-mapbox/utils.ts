import type { Map } from 'mapbox-gl';

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
