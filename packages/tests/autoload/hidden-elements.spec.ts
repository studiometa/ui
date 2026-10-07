import { beforeEach, describe, expect, it, vi } from 'vitest';

// Spy on the two resolvers, keeping their implementation. `MapboxMap` is the
// only caller of `resolveMapboxGl()`, and `MapboxGeocoder` the only caller of
// `resolveMapboxGeocoder()`, so a call to either one is the moment the matching
// library is requested.
vi.mock('../../ui-mapbox/src/dependencies.ts', { spy: true });

import {
  type ComponentManifest,
  type ComponentManifestEntry,
  getInstance,
  registerManifest,
} from '@studiometa/js-toolkit';
import {
  captureDiagnostics,
  mount,
  resetRegistry,
  settle,
  waitFor,
} from '@studiometa/js-toolkit/test';
import type {
  MapboxCluster,
  MapboxGeocoder,
  MapboxMap,
  MapboxMarker,
  MapboxNavigationControl,
  StoreLocator,
} from '@studiometa/ui-mapbox';
import { manifest } from '@studiometa/ui-mapbox/manifest';
import { resolveMapboxGeocoder, resolveMapboxGl } from '../../ui-mapbox/src/dependencies.ts';
// The harness loads the `mapbox-gl` and geocoder doubles and injects them, so a
// map that mounts here builds a `MockMap` instead of the real library.
import { mapDouble, type MockMap } from '../MapboxMap/harness.js';
import type { MockMarker } from '../MapboxMap/mock-mapbox-gl.js';

/**
 * These specs run the shipped setup: the real `@studiometa/ui-mapbox`
 * manifest, with its own mount strategy for each token. The map children are
 * `eager`, so they mount because their element exists, `hidden` or not.
 * `MapboxMap`, `StoreLocator` and `MapboxGeocoder` are `visible`, so they load
 * when they near the viewport.
 *
 * Each entry keeps its strategy, and its loader counts how many times the
 * registry asked for the module.
 */
const loads: Record<string, number> = {};

const countedManifest: ComponentManifest = Object.fromEntries(
  Object.entries(manifest as Record<string, ComponentManifestEntry>).map(([token, entry]) => [
    token,
    {
      mountStrategy: entry.mountStrategy,
      load() {
        loads[token] = (loads[token] ?? 0) + 1;
        return entry.load();
      },
    },
  ]),
);

beforeEach(() => {
  // Once a lazy entry loads, the registry keeps the class instead, and later
  // elements use the class strategy. Start every test from lazy entries again.
  resetRegistry();
  registerManifest(countedManifest);

  for (const token of Object.keys(loads)) {
    delete loads[token];
  }

  vi.mocked(resolveMapboxGl).mockClear();
  vi.mocked(resolveMapboxGeocoder).mockClear();
});

/**
 * Put the markup below the fold, so a `visible` entry inside it has not
 * crossed into the viewport yet.
 */
function belowTheFold(html: string): string {
  return `<div style="height: 300vh"></div>${html}`;
}

/** The map double a mounted `MapboxMap` builds, once it exists. */
async function builtMap(mapEl: HTMLElement): Promise<MockMap> {
  const mapbox = await waitFor(() => getInstance<MapboxMap>(mapEl, 'MapboxMap'));
  await waitFor(() => mapbox.map);
  return mapDouble(mapbox);
}

describe('autoloading map children declared on a hidden element', () => {
  it('mounts them before a below-the-fold map exists, then attaches them when the map loads', async () => {
    const log = captureDiagnostics();

    try {
      const root = await mount(
        belowTheFold(`
          <div data-component="MapboxMap" data-option-access-token="test-token">
            <div data-ref="container" style="height: 200px"></div>
            <div hidden data-component="MapboxNavigationControl" data-option-position="top-right"></div>
            <div hidden data-component="MapboxMarker" data-option-lng-lat="[2.35, 48.85]">
              <div data-component="MapboxPopup" data-option-lng-lat="[2.35, 48.85]"></div>
            </div>
          </div>
        `),
      );
      const mapEl = root.querySelector<HTMLElement>('[data-component="MapboxMap"]')!;
      const controlEl = root.querySelector<HTMLElement>(
        '[data-component="MapboxNavigationControl"]',
      )!;
      const markerEl = root.querySelector<HTMLElement>('[data-component="MapboxMarker"]')!;
      const popupEl = root.querySelector<HTMLElement>('[data-component="MapboxPopup"]')!;

      // The children are `eager`: they mount because they are on the page.
      const control = await waitFor(() =>
        getInstance<MapboxNavigationControl>(controlEl, 'MapboxNavigationControl'),
      );
      const marker = await waitFor(() => getInstance<MapboxMarker>(markerEl, 'MapboxMarker'));
      await waitFor(() => getInstance(popupEl, 'MapboxPopup'));

      // The map is `visible` and below the fold: it has no instance yet, so
      // nothing has requested `mapbox-gl`.
      await settle();
      expect(control.$isMounted).toBe(true);
      expect(marker.$isMounted).toBe(true);
      expect(getInstance(mapEl, 'MapboxMap')).toBeUndefined();
      expect(loads.MapboxMap).toBeUndefined();
      expect(resolveMapboxGl).not.toHaveBeenCalled();

      mapEl.scrollIntoView();
      const mockMap = await builtMap(mapEl);
      expect(loads.MapboxMap).toBe(1);
      expect(resolveMapboxGl).toHaveBeenCalledTimes(1);

      mockMap.fire('load');

      // Every child that mounted first attaches to the map it waited for.
      await waitFor(() => mockMap.addControl.mock.calls.length > 0);
      expect(mockMap.addControl).toHaveBeenCalledWith(control.control, 'top-right');

      const mockMarker = marker.marker as unknown as MockMarker;
      await waitFor(() => mockMarker.addTo.mock.calls.length > 0);
      expect(mockMarker.addTo).toHaveBeenCalledWith(mockMap);
      expect(mockMarker.setPopup).toHaveBeenCalledWith(marker.popup.popup);

      expect(log.codes).toEqual([]);
    } finally {
      log.stop();
    }
  });

  it('lets a below-the-fold store locator wire a cluster that mounted before it', async () => {
    const log = captureDiagnostics();

    try {
      const root = await mount(
        belowTheFold(`
          <div data-component="StoreLocator">
            <div data-component="MapboxMap" data-option-access-token="test-token">
              <div data-ref="container" style="height: 200px"></div>
              <div data-component="MapboxCluster">
                <ul>
                  <li data-component="MapboxClusterItem" data-option-id="a" data-option-lng-lat="[2, 48]"><button type="button">a</button></li>
                  <li data-component="MapboxClusterItem" data-option-id="b" data-option-lng-lat="[3, 49]"><button type="button">b</button></li>
                </ul>
              </div>
            </div>
          </div>
        `),
      );
      const locatorEl = root.querySelector<HTMLElement>('[data-component="StoreLocator"]')!;
      const mapEl = root.querySelector<HTMLElement>('[data-component="MapboxMap"]')!;
      const clusterEl = root.querySelector<HTMLElement>('[data-component="MapboxCluster"]')!;

      // The cluster and its items are `eager`: they mount first.
      const cluster = await waitFor(() => getInstance<MapboxCluster>(clusterEl, 'MapboxCluster'));

      await settle();
      expect(getInstance(locatorEl, 'StoreLocator')).toBeUndefined();
      expect(getInstance(mapEl, 'MapboxMap')).toBeUndefined();
      expect(resolveMapboxGl).not.toHaveBeenCalled();

      locatorEl.scrollIntoView();
      const locator = await waitFor(() => getInstance<StoreLocator>(locatorEl, 'StoreLocator'));
      const mockMap = await builtMap(mapEl);

      mockMap.fire('load');

      await waitFor(() => locator.isLoaded);
      expect(locator.cluster).toBe(cluster);
      expect(locator.items.map((item) => item.id)).toEqual(['a', 'b']);
      expect(log.codes).toEqual([]);
    } finally {
      log.stop();
    }
  });

  it('loads neither the geocoder module nor its library before a below-the-fold map nears the viewport', async () => {
    const root = await mount(
      belowTheFold(`
        <div data-component="MapboxMap" data-option-access-token="test-token">
          <div data-ref="container" style="height: 200px"></div>
          <div data-component="MapboxGeocoder" data-option-add-to-map></div>
        </div>
      `),
    );
    const mapEl = root.querySelector<HTMLElement>('[data-component="MapboxMap"]')!;
    const geocoderEl = root.querySelector<HTMLElement>('[data-component="MapboxGeocoder"]')!;

    await settle();
    expect(loads.MapboxGeocoder).toBeUndefined();
    expect(getInstance(geocoderEl, 'MapboxGeocoder')).toBeUndefined();
    expect(resolveMapboxGeocoder).not.toHaveBeenCalled();

    mapEl.scrollIntoView();
    const geocoder = await waitFor(() => getInstance<MapboxGeocoder>(geocoderEl, 'MapboxGeocoder'));
    expect(loads.MapboxGeocoder).toBe(1);
    await waitFor(() => vi.mocked(resolveMapboxGeocoder).mock.calls.length > 0);

    const mockMap = await builtMap(mapEl);
    mockMap.fire('load');

    // With `add-to-map`, the control ends on the map once it is ready.
    const control = await waitFor(() => geocoder.control);
    expect((control as unknown as { addTo: ReturnType<typeof vi.fn> }).addTo).toHaveBeenCalledWith(
      mockMap,
    );
  });
});
