import type { ComponentCatalog, CuratedComponentMetadata } from '../../scripts/manifest-types.js';

// Mapbox GL and the optional geocoder are external (import-map resolved) and no longer served by
// the CDN, so these components declare neither a CDN-served stylesheet nor a bundled integration
// chunk — consumers load the Mapbox JavaScript and CSS from the source their import map points at.
const components: readonly CuratedComponentMetadata[] = [
  { token: 'MapboxCluster', group: 'mapbox' },
  { token: 'MapboxClusterItem', group: 'mapbox' },
  { token: 'MapboxFullscreenControl', group: 'mapbox' },
  { token: 'MapboxGeocoder', group: 'mapbox' },
  { token: 'MapboxGeolocateControl', group: 'mapbox' },
  { token: 'MapboxImage', group: 'mapbox' },
  { token: 'MapboxImages', group: 'mapbox' },
  { token: 'MapboxLayer', group: 'mapbox' },
  { token: 'MapboxMap', group: 'mapbox' },
  { token: 'MapboxMarker', group: 'mapbox' },
  { token: 'MapboxNavigationControl', group: 'mapbox' },
  { token: 'MapboxPopup', group: 'mapbox' },
  { token: 'MapboxSource', group: 'mapbox' },
  { token: 'StoreLocator', group: 'mapbox' },
];

/** The autoload catalog for every declarative `@studiometa/ui-mapbox` component. */
export const catalog: ComponentCatalog = {
  packageName: '@studiometa/ui-mapbox',
  strategy: 'visible',
  components,
  abstractExports: ['AbstractMapboxControl', 'AbstractMapboxMapChild'],
};
