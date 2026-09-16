import { Base, getInstance, registerComponent, registerManifest } from '@studiometa/js-toolkit';
import { mount, settle, waitFor } from '@studiometa/js-toolkit/test';
import { MapboxMap } from '@studiometa/ui-mapbox';
import { manifest as mapboxManifest } from '@studiometa/ui-mapbox/manifest';
import { describe, expect, it } from 'vitest';
import { mountMap } from '../MapboxMap/harness.js';

/**
 * The `hidden` attribute is the pattern `@studiometa/ui-mapbox` documents for
 * the map children that render nothing. A `hidden` element is never rendered,
 * so it never intersects the viewport: a `visible` manifest entry on it waits
 * for a signal that can never arrive, and the dynamic `import()` never runs.
 *
 * The map children therefore declare `eager`, which has no condition left to
 * wait for beyond the element existing.
 */

// `MapboxMap` renders and is the ancestor every child resolves through, so it
// is registered as a class here: the test is about the children's entries, and
// a `visible` root would make the whole map wait on the viewport.
const { MapboxMap: _root, StoreLocator: _storeLocator, ...childEntries } = mapboxManifest;

registerComponent(MapboxMap);
registerManifest(childEntries);

/** A component whose only job is to record that its lazy entry was imported. */
class HiddenProbe extends Base {
  static config = { name: 'HiddenProbe' };
}

let probeImports = 0;
registerManifest({
  HiddenProbe: {
    mountStrategy: 'visible',
    load() {
      probeImports += 1;
      return HiddenProbe;
    },
  },
});

describe('autoloading an element carrying the hidden attribute', () => {
  it('loads and mounts an eager map child', async () => {
    const { mapEl } = await mountMap(`
      <div hidden data-component="MapboxNavigationControl" data-option-position="top-right"></div>
    `);
    const el = mapEl.querySelector<HTMLElement>('[data-component="MapboxNavigationControl"]')!;

    const instance = await waitFor(() => getInstance(el, 'MapboxNavigationControl'));

    expect(instance.$isMounted).toBe(true);
  });

  it('loads and mounts every hidden child of one map', async () => {
    const { mapEl } = await mountMap(`
      <div hidden data-component="MapboxFullscreenControl"></div>
      <div hidden data-component="MapboxGeolocateControl"></div>
      <div hidden data-component="MapboxMarker" data-option-lng-lat="[2, 48]"></div>
    `);

    for (const token of ['MapboxFullscreenControl', 'MapboxGeolocateControl', 'MapboxMarker']) {
      const el = mapEl.querySelector<HTMLElement>(`[data-component="${token}"]`)!;
      const instance = await waitFor(() => getInstance(el, token));

      expect(instance.$isMounted).toBe(true);
    }
  });

  it('never loads a visible entry, because a hidden element cannot intersect', async () => {
    const root = await mount(`
      <div hidden data-component="HiddenProbe"></div>
    `);
    await settle();

    expect(probeImports).toBe(0);
    expect(getInstance(root.firstElementChild as HTMLElement, 'HiddenProbe')).toBeUndefined();
  });
});
