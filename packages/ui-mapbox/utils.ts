import type { Map } from 'mapbox-gl';

/**
 * Per-map ownership registry for id-addressed contributions (sources, layers).
 *
 * Keyed weakly by the Mapbox `Map` instance (so the entry drops with the map),
 * then by a `kind:id` string, to the owning component instance. Authored ids
 * (`MapboxSource`/`MapboxLayer`) are shared, so during a `Fetch` swap the new
 * instance mounts — and adopts the id — before the old instance tears down. The
 * registry lets ownership pass from the outgoing instance to the incoming one so
 * the outgoing teardown never deletes the contribution the incoming one now
 * owns, and lets an externally declared id (owned by nobody) stay untouched.
 *
 * KNOWN LIMITATION (deferred, see PR #567 review H6): an entry only clears when
 * its owner *releases* it during teardown. If the underlying resource disappears
 * some other way — a full `map.setStyle()` replacement, or an external
 * `removeSource`/`removeLayer` — the entry is left dangling, still pointing at
 * the old component. A later resource created externally under the same id can
 * then be misclassified as family-owned and adopted. A robust fix (e.g. clearing
 * the registry on `styledata`/`style.load`, or re-validating ownership against
 * the live map on adopt) needs browser validation of Mapbox's style-lifecycle
 * events and is left as a follow-up; the common family-only `Fetch`-swap path is
 * unaffected because those entries are always released on teardown.
 * @private
 */
const ownershipRegistry = new WeakMap<object, globalThis.Map<string, unknown>>();

/**
 * Claim ownership of an id-addressed contribution on a map for the given owner,
 * taking over from any previous owner of the same id.
 *
 * @param {object}  map   The Mapbox map instance the contribution lives on.
 * @param {string}  key   The `kind:id` ownership key.
 * @param {unknown} owner The claiming component instance.
 */
export function claimMapboxOwnership(map: object, key: string, owner: unknown): void {
  let owners = ownershipRegistry.get(map);

  if (!owners) {
    owners = new globalThis.Map();
    ownershipRegistry.set(map, owners);
  }

  owners.set(key, owner);
}

/**
 * The current owner of an id-addressed contribution, if any.
 *
 * @param   {object}  map The Mapbox map instance the contribution lives on.
 * @param   {string}  key The `kind:id` ownership key.
 * @returns {unknown}     The owning instance, or `undefined` when nobody owns it.
 */
export function getMapboxOwner(map: object, key: string): unknown {
  return ownershipRegistry.get(map)?.get(key);
}

/**
 * Release ownership of an id-addressed contribution, but only when the given
 * owner is still the current one — a newer instance may already have taken over.
 *
 * @param {object}  map   The Mapbox map instance the contribution lives on.
 * @param {string}  key   The `kind:id` ownership key.
 * @param {unknown} owner The instance releasing the id.
 */
export function releaseMapboxOwnership(map: object, key: string, owner: unknown): void {
  const owners = ownershipRegistry.get(map);

  if (owners?.get(key) === owner) {
    owners.delete(key);
  }
}

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
