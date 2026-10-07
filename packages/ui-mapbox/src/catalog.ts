import type {
  ComponentCatalog,
  CuratedComponentMetadata,
} from '../../../scripts/manifest-types.js';

// Mapbox GL and the optional geocoder are external (import-map resolved) and not served by the
// CDN, so these components declare neither a CDN-served stylesheet nor a bundled integration
// chunk — consumers load the Mapbox JavaScript and CSS from the source their import map points at.
//
// The package default is `visible`, so a module loads when its element nears the viewport.
// `MapboxMap` and `StoreLocator` keep it, which holds the heavy `mapbox-gl` import back until a
// map nears the viewport. `MapboxGeocoder` keeps it too, so `@mapbox/mapbox-gl-geocoder` stays
// lazy: its element holds the search input, or nothing when the control is added to the map, so
// it never needs `hidden`.
//
// The other map children declare `eager`. They only need to exist: `MapboxMap` already gates
// `mapbox-gl`, so their own modules are small. Many of them render nothing and carry `hidden`,
// and a hidden element never intersects the viewport, so `visible` would never load them. The
// registry only schedules a token declared on an element of the page, so `eager` imports a
// module because its element exists, on a background scheduler task, not at page load.
const components: readonly CuratedComponentMetadata[] = [
  { token: 'MapboxCluster', group: 'mapbox', strategy: 'eager' },
  { token: 'MapboxClusterItem', group: 'mapbox', strategy: 'eager' },
  { token: 'MapboxFullscreenControl', group: 'mapbox', strategy: 'eager' },
  { token: 'MapboxGeocoder', group: 'mapbox' },
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
