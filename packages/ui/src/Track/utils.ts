/**
 * Array merge strategy for `deepmerge`: replace the destination array with the
 * source array instead of concatenating.
 *
 * Concatenation is wrong for GA4 style payloads (e.g. `ecommerce.items`), where
 * a more specific layer should fully override the array coming from a broader
 * one. A shallow copy is returned so the merged payload never shares the array
 * instance of a memoized source (event data / context), which a downstream
 * consumer could otherwise mutate in place.
 */
export function arrayMerge(_destination: unknown[], source: unknown[]): unknown[] {
  return [...source];
}
