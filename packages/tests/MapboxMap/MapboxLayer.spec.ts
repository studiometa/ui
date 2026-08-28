import { describe, it, expect, vi } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { settle } from '@studiometa/js-toolkit/test';
import { MapboxLayer, MapboxMap } from '@studiometa/ui-mapbox';
import { append, mountMap } from './harness.js';

registerComponents(MapboxMap, MapboxLayer);

function layerHtml(id = 'test-layer', attrs = '') {
  return `<div data-component="MapboxLayer" data-option-id="${id}" data-option-layer='{"type":"fill","source":"test-source"}' ${attrs}></div>`;
}

/**
 * Mount a `MapboxMap` holding one `MapboxLayer` and load it.
 *
 * By default the referenced source already exists on the map so the layer is
 * added directly on ready. Pass `withSource: false` to exercise the deferred
 * path where the layer waits for its source to become available — the source is
 * seeded between mount and load, since the layer injects itself on `map-load`.
 */
async function createLayer(attrs = '', { withSource = true } = {}) {
  const context = await mountMap(layerHtml('test-layer', attrs));

  if (withSource) {
    context.mockMap.addSource('test-source', { type: 'geojson' });
  }

  await context.load();
  const el = context.mapEl.querySelector<HTMLElement>('[data-component="MapboxLayer"]')!;

  return {
    context,
    instance: getInstance<MapboxLayer>(el, 'MapboxLayer')!,
    mockMap: context.mockMap,
  };
}

describe('MapboxLayer component', () => {
  it('should mount and add layer to map', async () => {
    const { mockMap } = await createLayer();

    expect(mockMap.addLayer).toHaveBeenCalled();
  });

  it('should set layer id from options', async () => {
    const { mockMap } = await createLayer();

    const call = mockMap.addLayer.mock.calls[0];
    expect(call[0]).toMatchObject({ id: 'test-layer', type: 'fill', source: 'test-source' });
  });

  it('should pass beforeId option', async () => {
    const { mockMap } = await createLayer('data-option-before-id="other-layer"');

    expect(mockMap.addLayer).toHaveBeenCalledWith(expect.anything(), 'other-layer');
  });

  it('should remove layer on unmount if it exists', async () => {
    const { instance, mockMap } = await createLayer();

    // The layer was added on mount, so the default mock's `getLayer` (backed by
    // `_layers`) now reports it — no need to force the mock, which would also
    // make the layer look pre-existing at mount and defeat ownership tracking.
    instance.$unmount();
    await settle();

    expect(mockMap.getLayer).toHaveBeenCalledWith('test-layer');
    expect(mockMap.removeLayer).toHaveBeenCalledWith('test-layer');
  });

  it('should wait for the source before adding the layer when it is missing', async () => {
    const { mockMap } = await createLayer('', { withSource: false });

    // The source is missing: the layer must not be added yet.
    expect(mockMap.addLayer).not.toHaveBeenCalled();

    // The source becomes available; `addSource` fires `sourcedata` the way
    // mapbox-gl does once the data is loaded.
    mockMap.addSource('test-source', { type: 'geojson' });
    // Flush the microtask scheduling the deferred `addLayer` call.
    await settle();

    expect(mockMap.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'test-layer' }),
      '',
    );
  });

  it('should tolerate an id owned by a sibling and not let the old teardown delete it (B3)', async () => {
    // Both instances share ONE map with the referenced source already present.
    const context = await mountMap(layerHtml('stores-layer'));
    context.mockMap.addSource('test-source', { type: 'geojson' });
    await context.load();

    const { mockMap } = context;
    const oldEl = context.mapEl.querySelector<HTMLElement>('[data-component="MapboxLayer"]')!;
    const oldInstance = getInstance<MapboxLayer>(oldEl, 'MapboxLayer')!;

    expect(mockMap.addLayer).toHaveBeenCalledTimes(1);

    // The replacement mounts while the old instance still owns the id.
    const newEl = await append(context.mapEl, layerHtml('stores-layer'));
    const newInstance = getInstance<MapboxLayer>(newEl, 'MapboxLayer')!;

    // Adopt AND refresh: a same-id swap may change source/type/paint/layout/
    // filter/zoom-range/beforeId, so the replacement re-applies its definition by
    // removing the existing layer and re-adding its own (never a bare duplicate
    // `addLayer`, which would throw), then takes over ownership.
    expect(mockMap.removeLayer).toHaveBeenCalledTimes(1);
    expect(mockMap.addLayer).toHaveBeenCalledTimes(2);
    expect(mockMap.getLayer('stores-layer')).toBeDefined();

    // The old instance tears down: it must not delete the adopted layer (the new
    // instance owns it now), so the remove count stays put.
    oldInstance.$unmount();
    await settle();

    expect(mockMap.removeLayer).toHaveBeenCalledTimes(1);
    expect(mockMap.getLayer('stores-layer')).toBeDefined();

    // The new instance, still the owner, removes it on its own teardown.
    newInstance.$unmount();
    await settle();

    expect(mockMap.removeLayer).toHaveBeenCalledTimes(2);
    expect(mockMap.removeLayer).toHaveBeenLastCalledWith('stores-layer');
  });

  it('should not remove layer on unmount if it does not exist', async () => {
    const { instance, mockMap } = await createLayer();
    mockMap.getLayer = vi.fn(() => undefined as never);

    instance.$unmount();
    await settle();

    expect(mockMap.removeLayer).not.toHaveBeenCalled();
  });
});
