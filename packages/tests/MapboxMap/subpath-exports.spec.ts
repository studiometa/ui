import { test, expect } from 'vitest';
// Importing the mock registers the `mapbox-gl` module mock before the package
// (and its real `mapbox-gl` dependency) is imported below.
import { MockMap } from './mock-mapbox-gl.js';
import * as barrel from '@studiometa/ui-mapbox';
import MapboxMapDefault, { MapboxMap as MapboxMapNamed } from '@studiometa/ui-mapbox/MapboxMap';
import StoreLocatorDefault, {
  StoreLocator as StoreLocatorNamed,
} from '@studiometa/ui-mapbox/StoreLocator';
import MapboxClusterDefault, {
  MapboxCluster as MapboxClusterNamed,
} from '@studiometa/ui-mapbox/MapboxCluster';
// The `.js`-extensioned subpaths must resolve to the same modules as the
// extensionless ones above.
import MapboxMapJsDefault, {
  MapboxMap as MapboxMapJsNamed,
} from '@studiometa/ui-mapbox/MapboxMap.js';
import StoreLocatorJsDefault, {
  StoreLocator as StoreLocatorJsNamed,
} from '@studiometa/ui-mapbox/StoreLocator.js';
import MapboxClusterJsDefault, {
  MapboxCluster as MapboxClusterJsNamed,
} from '@studiometa/ui-mapbox/MapboxCluster.js';

test.each([
  ['MapboxMap', MapboxMapDefault, MapboxMapNamed, barrel.MapboxMap],
  ['StoreLocator', StoreLocatorDefault, StoreLocatorNamed, barrel.StoreLocator],
  ['MapboxCluster', MapboxClusterDefault, MapboxClusterNamed, barrel.MapboxCluster],
])('%s is available at its own subpath as default and named export', (_name, def, named, fromBarrel) => {
  // Ensure the `mapbox-gl` mock is registered before the package is imported.
  expect(MockMap).toBeDefined();
  // The default export is a js-toolkit `Base` subclass.
  expect('$isBase' in def).toBe(true);
  // The default, named and barrel exports all reference the exact same class.
  expect(def).toBe(named);
  expect(def).toBe(fromBarrel);
});

test.each([
  ['MapboxMap', MapboxMapJsDefault, MapboxMapJsNamed, barrel.MapboxMap],
  ['StoreLocator', StoreLocatorJsDefault, StoreLocatorJsNamed, barrel.StoreLocator],
  ['MapboxCluster', MapboxClusterJsDefault, MapboxClusterJsNamed, barrel.MapboxCluster],
])(
  '%s is available at its `.js`-extensioned subpath as default and named export',
  (_name, def, named, fromBarrel) => {
    // Ensure the `mapbox-gl` mock is registered before the package is imported.
    expect(MockMap).toBeDefined();
    // The default export is a js-toolkit `Base` subclass.
    expect('$isBase' in def).toBe(true);
    // The `.js`-extensioned subpath resolves to the same class as the
    // extensionless subpath and the barrel export.
    expect(def).toBe(named);
    expect(def).toBe(fromBarrel);
  },
);
