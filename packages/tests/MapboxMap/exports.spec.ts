import { test, expect } from 'vitest';
import type { BaseProps } from '@studiometa/js-toolkit';
// Importing the mock registers the `mapbox-gl` module mock before the package
// (and its real `mapbox-gl` dependency) is imported below.
import { MockMap } from './mock-mapbox-gl.js';
import * as components from '@studiometa/ui-mapbox';
import type {
  AbstractMapboxMapChildProps,
  MapboxClusterItemProps,
  MapboxClusterProps,
  MapboxGeocoderProps,
  MapboxImageProps,
  MapboxImagesProps,
  MapboxMapProps,
  StoreLocatorProps,
} from '@studiometa/ui-mapbox';

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
      "provideMapboxGeocoder",
      "provideMapboxGl",
      "resolveMapboxGeocoder",
      "resolveMapboxGl",
    ]
  `);

  for (const exported of Object.values(components)) {
    expect(exported).toBeDefined();
  }
});

/** The event names one component declares in its props type. */
type EmitNames<P extends BaseProps> = keyof NonNullable<P['$emits']> & string;

/**
 * An exhaustive, closed enumeration of a component's declared events.
 *
 * `Record<EmitNames<P>, true>` is the whole point: adding an event to the source
 * makes the literal below incomplete, and removing one makes it excessive — both
 * are compile errors. So the list can not silently drift from the component it
 * mirrors.
 */
function eventsOf<P extends BaseProps>(names: Record<EmitNames<P>, true>): string[] {
  return Object.keys(names);
}

/**
 * Every public event name of the family must carry the `map-` prefix, so a
 * consumer can tell a component event of this package from anything else on the
 * page — and so nothing collides with a platform event name.
 *
 * Events are declared in the props type, which is erased before the test runs.
 * The assertion is therefore made against the enumerations above, whose keys
 * the compiler pins to the very `$emits` maps the components declare — the
 * check is split between the type system (the set matches the source) and this
 * test (the shape of each name).
 *
 * The type half is enforced by an editor and by the type-aware `lint:static`
 * pass, which both load the root `tsconfig.json` — it includes this directory.
 * It is **not** enforced by `lint:types`: `tsconfig.lint.json` covers only the
 * three `src` trees and `scripts`.
 */
const FAMILY_EVENTS: Record<string, string[]> = {
  AbstractMapboxMapChild: eventsOf<AbstractMapboxMapChildProps>({ 'map-error': true }),
  MapboxCluster: eventsOf<MapboxClusterProps>({
    'map-error': true,
    'map-cluster-click': true,
    'map-item-click': true,
    'map-update': true,
  }),
  MapboxClusterItem: eventsOf<MapboxClusterItemProps>({ 'map-error': true }),
  MapboxGeocoder: eventsOf<MapboxGeocoderProps>({ 'map-error': true, 'map-result': true }),
  MapboxImage: eventsOf<MapboxImageProps>({ 'map-error': true, 'map-ready': true }),
  MapboxImages: eventsOf<MapboxImagesProps>({ 'map-error': true, 'map-ready': true }),
  MapboxMap: eventsOf<MapboxMapProps>({
    'map-load': true,
    'map-click': true,
    'map-dblclick': true,
    'map-mouseenter': true,
    'map-mouseleave': true,
    'map-mousemove': true,
    'map-movestart': true,
    'map-move': true,
    'map-moveend': true,
    'map-zoomstart': true,
    'map-zoom': true,
    'map-zoomend': true,
    'map-rotatestart': true,
    'map-rotate': true,
    'map-rotateend': true,
    'map-pitchstart': true,
    'map-pitch': true,
    'map-pitchend': true,
    'map-dragstart': true,
    'map-drag': true,
    'map-dragend': true,
    'map-idle': true,
    'map-render': true,
    'map-resize': true,
    'map-remove': true,
    'map-error': true,
  }),
  StoreLocator: eventsOf<StoreLocatorProps>({
    'map-select': true,
    'map-deselect': true,
    'map-filter': true,
  }),
};

test('@studiometa/ui-mapbox public events use the map- prefix', () => {
  const misnamed = Object.entries(FAMILY_EVENTS)
    .map(([component, events]) => [component, events.filter((e) => !e.startsWith('map-'))] as const)
    .filter(([, events]) => events.length > 0);
  expect(Object.fromEntries(misnamed)).toEqual({});

  // Every listed component must actually declare events, so an emptied
  // enumeration can not pass the check above by vacuity.
  const silent = Object.entries(FAMILY_EVENTS).filter(([, events]) => events.length === 0);
  expect(silent).toEqual([]);
});
