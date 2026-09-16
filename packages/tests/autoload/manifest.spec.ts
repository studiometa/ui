import {
  Base,
  type BaseConstructor,
  type ComponentManifest,
  type ComponentManifestEntry,
  type MountStrategy,
} from '@studiometa/js-toolkit';
import { manifest as uiManifest } from '@studiometa/ui/manifest';
import { manifest as mapboxManifest } from '@studiometa/ui-mapbox/manifest';
import { manifest as motionManifest } from '@studiometa/ui-motion/manifest';
import * as uiExports from '@studiometa/ui';
import * as mapboxExports from '@studiometa/ui-mapbox';
import * as motionExports from '@studiometa/ui-motion';
import { describe, expect, it } from 'vitest';

function isBaseConstructor(value: unknown): value is BaseConstructor {
  return typeof value === 'function' && value.prototype instanceof Base;
}

/**
 * The two `@studiometa/ui-mapbox` components that render. They keep the package
 * default `visible`; every other entry configures the map from markup that
 * renders nothing and is therefore `eager`.
 */
const MAPBOX_VISIBLE_TOKENS: readonly string[] = ['MapboxMap', 'StoreLocator'];

const MAPBOX_EAGER_TOKENS: readonly string[] = [
  'MapboxCluster',
  'MapboxClusterItem',
  'MapboxFullscreenControl',
  'MapboxGeocoder',
  'MapboxGeolocateControl',
  'MapboxImage',
  'MapboxImages',
  'MapboxLayer',
  'MapboxMarker',
  'MapboxNavigationControl',
  'MapboxPopup',
  'MapboxSource',
];

type ManifestCase = readonly [
  packageName: string,
  manifest: ComponentManifest,
  exports: Record<string, unknown>,
  strategyFor: (token: string) => MountStrategy,
];

// A package declares one default strategy, and a component overrides it when
// that default cannot answer for it — so the expectation is per token, not per
// package.
const cases: readonly ManifestCase[] = [
  ['@studiometa/ui', uiManifest, uiExports as Record<string, unknown>, () => 'eager'],
  [
    '@studiometa/ui-mapbox',
    mapboxManifest,
    mapboxExports as Record<string, unknown>,
    (token) => (MAPBOX_VISIBLE_TOKENS.includes(token) ? 'visible' : 'eager'),
  ],
  [
    '@studiometa/ui-motion',
    motionManifest,
    motionExports as Record<string, unknown>,
    () => 'visible',
  ],
];

// A generated manifest entry holds only what the registry reads before the
// module is loaded: `{ load, mountStrategy }`. Everything else stays in the
// authoring catalog the generator reads from. The token is not restated inside
// the entry — it *is* the key — which is why the assertions below read the key
// and then check that the loaded class agrees with it.
describe.each(cases)('%s ./manifest export', (_packageName, manifest, exports, strategyFor) => {
  it('declares the expected mount strategy on every entry', () => {
    expect(Object.keys(manifest).length).toBeGreaterThan(0);

    for (const [token, entry] of Object.entries(manifest) as [string, ComponentManifestEntry][]) {
      expect(entry.mountStrategy).toBe(strategyFor(token));
    }
  });

  it('loads each entry to the Base constructor the barrel exports under its token', async () => {
    for (const [token, entry] of Object.entries(manifest) as [string, ComponentManifestEntry][]) {
      const Constructor = await entry.load();

      expect(isBaseConstructor(Constructor)).toBe(true);
      // The registry keys an instance, its `$id` and its `INSTANCES` entry by
      // the *resolved config name*, and reports a `registry.lazy-name-mismatch`
      // when it disagrees with the manifest key. Asserting it here is what used
      // to be `entry.token === token`.
      expect((Constructor as BaseConstructor).config.name).toBe(token);
      expect(exports[token]).toBe(Constructor);
    }
  });
});

// Listing both halves keeps a new component from inheriting a strategy by
// accident: adding one to the catalog fails here until it is classified.
describe('@studiometa/ui-mapbox mount strategies', () => {
  it('splits every entry between the rendered roots and the declarative children', () => {
    const eager = Object.entries(mapboxManifest)
      .filter(([, entry]) => (entry as ComponentManifestEntry).mountStrategy === 'eager')
      .map(([token]) => token);
    const visible = Object.entries(mapboxManifest)
      .filter(([, entry]) => (entry as ComponentManifestEntry).mountStrategy === 'visible')
      .map(([token]) => token);

    expect(visible).toEqual([...MAPBOX_VISIBLE_TOKENS]);
    expect(eager).toEqual([...MAPBOX_EAGER_TOKENS]);
    expect(eager.length + visible.length).toBe(Object.keys(mapboxManifest).length);
  });
});
