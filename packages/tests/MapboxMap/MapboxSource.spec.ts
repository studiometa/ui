import { describe, it, expect, vi } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { settle } from '@studiometa/js-toolkit/test';
import { MapboxMap, MapboxSource } from '@studiometa/ui-mapbox';
import { append, mountMap } from './harness.js';

registerComponents(MapboxMap, MapboxSource);

function sourceHtml(
  id = 'my-source',
  source = '{"type":"geojson","data":{"type":"FeatureCollection","features":[]}}',
  children = '',
) {
  return `<div data-component="MapboxSource" data-option-id="${id}" data-option-source='${source}'>${children}</div>`;
}

/**
 * Mount a `MapboxMap` holding one `MapboxSource`, WITHOUT loading the map yet.
 *
 * The source injects itself on `map-load`, so a test that must seed or stub the
 * map double first calls `context.load()` once it is set up.
 */
async function createSource(children = '') {
  const context = await mountMap(sourceHtml('my-source', undefined, children));
  const el = context.mapEl.querySelector<HTMLElement>('[data-component="MapboxSource"]')!;

  return {
    context,
    instance: getInstance<MapboxSource>(el, 'MapboxSource')!,
    mockMap: context.mockMap,
  };
}

describe('MapboxSource component', () => {
  it('should mount and add source to map', async () => {
    const { context, mockMap } = await createSource();
    await context.load();

    expect(mockMap.addSource).toHaveBeenCalledWith(
      'my-source',
      expect.objectContaining({ type: 'geojson' }),
    );
  });

  it('should inject inline GeoJSON from the `geojson` script ref as the source data', async () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 2] }, properties: {} },
      ],
    };
    const { context, mockMap } = await createSource(
      `<script data-ref="geojson" type="application/json">${JSON.stringify(geojson)}</script>`,
    );
    await context.load();

    expect(mockMap.addSource).toHaveBeenCalledWith(
      'my-source',
      expect.objectContaining({ type: 'geojson', data: geojson }),
    );
  });

  it('should keep the option source data when the `geojson` ref is empty', async () => {
    // A present but empty (or whitespace-only) script ref must be treated as
    // "no inline data": the `source` option is used as is, without injecting
    // `data: null` (which `JSON.parse('null')` would otherwise produce).
    const { context, mockMap } = await createSource(
      '<script data-ref="geojson" type="application/json"></script>',
    );
    await context.load();

    expect(mockMap.addSource).toHaveBeenCalledWith(
      'my-source',
      expect.objectContaining({
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      }),
    );
  });

  it('should not add the source twice if it already exists', async () => {
    const { context, mockMap } = await createSource();
    mockMap.getSource = vi.fn(() => ({ id: 'my-source' }) as never);
    await context.load();

    expect(mockMap.addSource).not.toHaveBeenCalled();
  });

  it('should remove tied layers then the source on unmount', async () => {
    const { context, instance, mockMap } = await createSource();
    await context.load();

    // Two layers reference the source, one does not.
    mockMap._layers = [
      { id: 'tied-layer', source: 'my-source' },
      { id: 'other-layer', source: 'another-source' },
    ];

    instance.$unmount();
    await settle();

    expect(mockMap.removeLayer).toHaveBeenCalledWith('tied-layer');
    expect(mockMap.removeLayer).not.toHaveBeenCalledWith('other-layer');
    expect(mockMap.removeSource).toHaveBeenCalledWith('my-source');

    // Layers must be removed before the source they depend on.
    const removeLayerOrder = mockMap.removeLayer.mock.invocationCallOrder[0];
    const removeSourceOrder = mockMap.removeSource.mock.invocationCallOrder[0];
    expect(removeLayerOrder).toBeLessThan(removeSourceOrder);
  });

  it('should not remove a pre-existing source (or its tied layers) it did not add on unmount', async () => {
    const { context, instance, mockMap } = await createSource();

    // The source id is already registered on the map by someone else, so
    // `mounted()` skips `addSource` and this instance never owns it.
    mockMap.seedSource('my-source');
    // A layer tied to the pre-existing source is present too.
    mockMap._layers = [{ id: 'tied-layer', source: 'my-source' }];

    await context.load();
    expect(mockMap.addSource).not.toHaveBeenCalled();

    instance.$unmount();
    await settle();

    // Ownership guard: teardown must not touch state this instance never added.
    expect(mockMap.removeLayer).not.toHaveBeenCalled();
    expect(mockMap.removeSource).not.toHaveBeenCalled();
  });

  it('should adopt an id owned by a sibling instead of throwing, and not let the old teardown delete it (B3)', async () => {
    // Both instances share ONE map, as a `Fetch` swap of the same-id source would.
    const context = await mountMap(sourceHtml('stores'));
    await context.load();

    const oldEl = context.mapEl.querySelector<HTMLElement>('[data-component="MapboxSource"]')!;
    const oldInstance = getInstance<MapboxSource>(oldEl, 'MapboxSource')!;
    const { mockMap } = context;

    expect(mockMap.addSource).toHaveBeenCalledTimes(1);
    const source = mockMap.getSource('stores');

    // The replacement mounts (mount scan runs before the terminate scan) while
    // the old instance still owns the id.
    const newData = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 2] }, properties: {} },
      ],
    };
    const newEl = await append(
      context.mapEl,
      sourceHtml('stores', JSON.stringify({ type: 'geojson', data: newData })),
    );
    const newInstance = getInstance<MapboxSource>(newEl, 'MapboxSource')!;

    // Adopt-or-replace: no second `addSource` (which would throw a duplicate id),
    // the existing source's data is updated instead.
    expect(mockMap.addSource).toHaveBeenCalledTimes(1);
    expect(source.setData).toHaveBeenCalledWith(newData);

    // The old instance now tears down. It must NOT delete the source the new
    // instance has adopted.
    oldInstance.$unmount();
    await settle();

    expect(mockMap.removeSource).not.toHaveBeenCalled();
    expect(mockMap.getSource('stores')).toBeDefined();

    // The new instance, still the owner, removes it on its own teardown.
    newInstance.$unmount();
    await settle();

    expect(mockMap.removeSource).toHaveBeenCalledWith('stores');
  });

  it('should not remove the source on unmount if it does not exist', async () => {
    const { context, instance, mockMap } = await createSource();
    await context.load();

    // Source is gone by the time the component is unmounted.
    mockMap.getSource = vi.fn(() => undefined as never);

    instance.$unmount();
    await settle();

    expect(mockMap.removeSource).not.toHaveBeenCalled();
  });
});
