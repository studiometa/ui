import type {
  ComponentCatalog,
  CuratedComponentMetadata,
} from '../../../scripts/manifest-types.js';

// Mapbox GL and the optional geocoder are external (import-map resolved) and not served by the
// CDN, so these components declare neither a CDN-served stylesheet nor a bundled integration
// chunk — consumers load the Mapbox JavaScript and CSS from the source their import map points at.
//
// `MapboxMap` and `StoreLocator` render, so the package default `visible` suits them: the import
// waits until the map is about to be seen. Every other component configures the map from markup
// that renders nothing, and the README tells consumers to mark such an element `hidden`. A hidden
// element never intersects the viewport, so a `visible` entry would wait for a signal that can
// never come. They declare `eager` instead: the registry only schedules a token declared in the
// document, so the import happens because the element exists, and it runs on a background
// scheduler task rather than at page load. The heavy `mapbox-gl` import stays behind `MapboxMap`.
const components: readonly CuratedComponentMetadata[] = [
  { token: 'MapboxCluster', group: 'mapbox', strategy: 'eager' },
  { token: 'MapboxClusterItem', group: 'mapbox', strategy: 'eager' },
  { token: 'MapboxFullscreenControl', group: 'mapbox', strategy: 'eager' },
  { token: 'MapboxGeocoder', group: 'mapbox', strategy: 'eager' },
  { token: 'MapboxGeolocateControl', group: 'mapbox', strategy: 'eager' },
  { token: 'MapboxImage', group: 'mapbox', strategy: 'eager' },
  { token: 'MapboxImages', group: 'mapbox', strategy: 'eager' },
  { token: 'MapboxLayer', group: 'mapbox', strategy: 'eager' },
  { token: 'MapboxMap', group: 'mapbox' },
  { token: 'MapboxMarker', group: 'mapbox', strategy: 'eager' },
  { token: 'MapboxNavigationControl', group: 'mapbox', strategy: 'eager' },
  { token: 'MapboxPopup', group: 'mapbox', strategy: 'eager' },
  { token: 'MapboxSource', group: 'mapbox', strategy: 'eager' },
  { token: 'StoreLocator', group: 'mapbox' },
];

/** The autoload catalog for every declarative `@studiometa/ui-mapbox` component. */
export const catalog: ComponentCatalog = {
  packageName: '@studiometa/ui-mapbox',
  strategy: 'visible',
  components,
  abstractExports: ['AbstractMapboxControl', 'AbstractMapboxMapChild'],
};
