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
      "MapboxCluster",
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
      "StoreLocatorItem",
    ]
  `);

  for (const exported of Object.values(components)) {
    expect(exported).toBeDefined();
  }
});
