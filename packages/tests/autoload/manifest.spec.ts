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
 * The `@studiometa/ui-mapbox` components that keep the package default
 * `visible`, so their heavy dependency waits for the viewport: `mapbox-gl` for
 * the map and the store locator, `@mapbox/mapbox-gl-geocoder` for the geocoder.
 * Every other map child only needs to exist and is `eager`.
 */
const MAPBOX_VISIBLE_TOKENS: readonly string[] = ['MapboxGeocoder', 'MapboxMap', 'StoreLocator'];

const MAPBOX_EAGER_TOKENS: readonly string[] = [
  'MapboxCluster',
  'MapboxClusterItem',
  'MapboxFullscreenControl',
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
  it('splits every entry between the visible components and the eager children', () => {
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

/**
 * The strategy the registry uses for a class: the nearest `config` in the
 * prototype chain that declares `mountStrategy`, or `eager` when none does.
 * This is the same merge as js-toolkit's own config resolution.
 */
function classStrategy(Constructor: BaseConstructor): MountStrategy {
  for (
    let current: unknown = Constructor;
    isBaseConstructor(current);
    current = Object.getPrototypeOf(current)
  ) {
    if (Object.hasOwn(current, 'config') && Object.hasOwn(current.config, 'mountStrategy')) {
      return current.config.mountStrategy ?? 'eager';
    }
  }
  return 'eager';
}

/**
 * List the entries whose class strategy differs from their manifest strategy,
 * as `token: manifest -> class`.
 */
async function strategyMismatches(
  manifest: ComponentManifest,
  filter: (entry: ComponentManifestEntry) => boolean = () => true,
): Promise<string[]> {
  const mismatches: string[] = [];

  for (const [token, entry] of Object.entries(manifest) as [string, ComponentManifestEntry][]) {
    if (!filter(entry)) {
      continue;
    }
    const strategy = classStrategy((await entry.load()) as BaseConstructor);
    if (strategy !== entry.mountStrategy) {
      mismatches.push(`${token}: ${entry.mountStrategy} -> ${strategy}`);
    }
  }

  return mismatches;
}

// The registry reads a manifest entry's strategy only until its module loads.
// It then registers the class, and every later element with that token uses
// the class strategy. A lazy entry whose class declares no strategy therefore
// stays lazy for the first element only: every later element mounts at once.
describe('mount strategies after a lazy entry loads', () => {
  it('gives every @studiometa/ui-mapbox class the strategy of its manifest entry', async () => {
    // Strict in both directions: an `eager` entry whose class waited for the
    // viewport would never mount a `hidden` map child.
    expect(await strategyMismatches(mapboxManifest)).toEqual([]);
  });

  it('keeps every lazy @studiometa/ui entry lazy once its class is registered', async () => {
    // The `@studiometa/ui` manifest imports every module eagerly on purpose,
    // and a class that declares a condition, such as `in-view`, still decides
    // when it mounts. Only a lazy entry must agree with its class.
    expect(
      await strategyMismatches(uiManifest, (entry) => entry.mountStrategy !== 'eager'),
    ).toEqual([]);
  });
});
