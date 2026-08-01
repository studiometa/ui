import type { Map } from 'mapbox-gl';

/**
 * A single ownership entry: the owning component instance plus a liveness probe.
 * @private
 */
interface MapboxOwnershipEntry {
  /**
   * The owning component instance.
   */
  owner: unknown;
  /**
   * Whether the resource this owner added is *still the one on the live map*.
   *
   * Returns `false` once the resource has been removed (a `setStyle` wipe, an
   * external `removeSource`/`removeLayer`) or replaced by a different resource
   * under the same id (external re-add). This is what keeps the registry honest
   * without a separate reset pass: a stale entry is detected on read and pruned.
   */
  isLive: () => boolean;
}

/**
 * Per-map ownership registry for id-addressed contributions (sources, layers,
 * sprites).
 *
 * Keyed weakly by the Mapbox `Map` instance (so the entry drops with the map),
 * then by a `kind:id` string, to an ownership entry. Authored ids
 * (`MapboxSource`/`MapboxLayer`) are shared, so during a `Fetch` swap the new
 * instance mounts — and adopts the id — before the old instance tears down. The
 * registry lets ownership pass from the outgoing instance to the incoming one so
 * the outgoing teardown never deletes the contribution the incoming one now
 * owns, and lets an externally declared id (owned by nobody) stay untouched.
 *
 * H6 (PR #567 review) — staleness is validated on read, not merely on release.
 * An entry used to clear only when its owner *released* it during teardown, so a
 * resource that disappeared another way (a full `map.setStyle()` replacement, an
 * external `removeSource`/`removeLayer`) left a dangling entry that could
 * misclassify a later same-id resource as family-owned. Each entry now carries
 * an `isLive` probe checked in `getMapboxOwner`: when the owner's resource is no
 * longer the one on the map, the entry is pruned and reported as unowned. This
 * makes the registry self-healing across `setStyle` (owners re-claim with a
 * fresh probe as they re-inject) and external removal (the stale entry drops on
 * next read), with no concurrency-fragile "clear the whole map on style reload"
 * pass — which would race sibling re-injections claiming under the same style
 * load.
 *
 * REMAINING EDGE (documented, source/layer are robust): sprite liveness can only
 * probe `map.hasImage(name)` — Mapbox exposes no sprite object identity — so an
 * external `removeImage` followed by an external re-add under the same name reads
 * as live again and can still be misclassified. Sources and layers use object
 * identity (`getSource`/`getLayer` returning the very object the owner added), so
 * their external re-add is caught. The image edge needs a browser-validated
 * sprite-identity signal and is left as a follow-up.
 * @private
 */
const ownershipRegistry = new WeakMap<object, globalThis.Map<string, MapboxOwnershipEntry>>();

/**
 * Claim ownership of an id-addressed contribution on a map for the given owner,
 * taking over from any previous owner of the same id.
 *
 * @param {object}       map    The Mapbox map instance the contribution lives on.
 * @param {string}       key    The `kind:id` ownership key.
 * @param {unknown}      owner  The claiming component instance.
 * @param {() => boolean} isLive Probe reporting whether the resource this owner
 *   added is still the one on the live map. Checked on every `getMapboxOwner`
 *   read so a resource that was wiped by `setStyle` or removed/replaced
 *   externally is not mistaken for a live family-owned contribution.
 */
export function claimMapboxOwnership(
  map: object,
  key: string,
  owner: unknown,
  isLive: () => boolean,
): void {
  let owners = ownershipRegistry.get(map);

  if (!owners) {
    owners = new globalThis.Map();
    ownershipRegistry.set(map, owners);
  }

  owners.set(key, { owner, isLive });
}

/**
 * The current owner of an id-addressed contribution, if any.
 *
 * Validates the entry's liveness before reporting it: if the owner's resource is
 * no longer on the live map (removed by `setStyle`, an external
 * `removeSource`/`removeLayer`, or replaced by a different resource under the
 * same id), the stale entry is pruned and `undefined` is returned so the caller
 * treats the id as unowned — never adopting or deleting a stranger's resource.
 *
 * @param   {object}  map The Mapbox map instance the contribution lives on.
 * @param   {string}  key The `kind:id` ownership key.
 * @returns {unknown}     The owning instance, or `undefined` when nobody owns it.
 */
export function getMapboxOwner(map: object, key: string): unknown {
  const owners = ownershipRegistry.get(map);
  const entry = owners?.get(key);

  if (!entry) {
    return undefined;
  }

  if (!entry.isLive()) {
    owners!.delete(key);
    return undefined;
  }

  return entry.owner;
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

  if (owners?.get(key)?.owner === owner) {
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
