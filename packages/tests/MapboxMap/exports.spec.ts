import { test, expect } from 'vitest';
// Importing the mock registers the `mapbox-gl` module mock before the package
// (and its real `mapbox-gl` dependency) is imported below.
import { MockMap } from './mock-mapbox-gl.js';
import * as components from '@studiometa/ui-mapbox';

test('@studiometa/ui-mapbox exports', () => {
  expect(MockMap).toBeDefined();

  expect(Object.keys(components).toSorted()).toMatchInlineSnapshot(`
    [
      "AbstractMapboxControl",
      "AbstractMapboxMapChild",
      "MAPBOX_CLUSTER_CONNECTED",
      "MAPBOX_MAP_CONNECTED",
      "MapboxCluster",
      "MapboxClusterItem",
      "MapboxFullscreenControl",
      "MapboxGeocoder",
      "MapboxGeolocateControl",
      "MapboxImage",
      "MapboxImages",
      "MapboxLayer",
      "MapboxMap",
      "MapboxMarker",
      "MapboxNavigationControl",
      "MapboxPopup",
      "MapboxSource",
      "StoreLocator",
    ]
  `);

  for (const exported of Object.values(components)) {
    expect(exported).toBeDefined();
  }
});

test('@studiometa/ui-mapbox public events use the map- prefix', () => {
  const emitters = [
    components.AbstractMapboxMapChild,
    components.MapboxCluster,
    components.MapboxClusterItem,
    components.MapboxGeocoder,
    components.MapboxImage,
    components.MapboxImages,
    components.MapboxMap,
    components.StoreLocator,
  ];

  for (const component of emitters) {
    expect(component.config.emits?.every((event) => event.startsWith('map-'))).toBe(true);
  }
});
