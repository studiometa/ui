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
