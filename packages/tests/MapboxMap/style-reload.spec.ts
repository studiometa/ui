import { describe, it, expect } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { settle } from '@studiometa/js-toolkit/test';
import type { MockMap } from './mock-mapbox-gl.js';
import {
  MapboxCluster,
  MapboxImage,
  MapboxLayer,
  MapboxMap,
  MapboxSource,
} from '@studiometa/ui-mapbox';
import { claimMapboxOwnership, getMapboxOwner } from '@studiometa/ui-mapbox/utils';
import { append, mountMap } from './harness.js';

registerComponents(MapboxMap, MapboxSource, MapboxLayer, MapboxImage, MapboxCluster);

function sourceHtml(id = 'my-source') {
  return `<div data-component="MapboxSource" data-option-id="${id}" data-option-source='{"type":"geojson","data":{"type":"FeatureCollection","features":[]}}'></div>`;
}

function layerHtml(id = 'my-layer', source = 'my-source') {
  return `<div data-component="MapboxLayer" data-option-id="${id}" data-option-layer='${JSON.stringify({ type: 'fill', source })}'></div>`;
}

function imageHtml(name = 'my-image') {
  return `<div data-component="MapboxImage" data-option-name="${name}" data-option-url="https://example.test/icon.png"></div>`;
}

/** Mount a loaded `MapboxMap` the declarative children can be appended to. */
async function mountLoadedMap() {
  const context = await mountMap();
  await context.load();
  return context;
}

/** Append a child and hand back its instance. */
async function add<T>(mapEl: HTMLElement, html: string, name: string): Promise<T> {
  const el = await append(mapEl, html);
  return getInstance<never>(el, name) as T;
}

/** Replace the style, then let every deferred re-injection land. */
async function setStyle(mockMap: MockMap) {
  mockMap.setStyle('mapbox://styles/mapbox/dark-v11');
  await settle();
}

describe('style-reload re-injection (H7)', () => {
  it('re-injects a mounted MapboxSource + MapboxLayer + MapboxImage after setStyle', async () => {
    const { mapEl, mockMap } = await mountLoadedMap();

    // Mount source first so its `style.load` handler runs before the layer's;
    // either order works (the layer's standing `sourcedata` watch recovers too).
    await add<MapboxSource>(mapEl, sourceHtml(), 'MapboxSource');
    await add<MapboxLayer>(mapEl, layerHtml(), 'MapboxLayer');
    await add<MapboxImage>(mapEl, imageHtml(), 'MapboxImage');

    // Everything is on the initial style.
    expect(mockMap.getSource('my-source')).toBeDefined();
    expect(mockMap.getLayer('my-layer')).toBeDefined();
    expect(mockMap.hasImage('my-image')).toBe(true);

    const addSourceCalls = mockMap.addSource.mock.calls.length;
    const addLayerCalls = mockMap.addLayer.mock.calls.length;

    // A full style replacement wipes sources, layers and sprites, then fires
    // `style.load`. The mounted children must re-inject onto the new style.
    await setStyle(mockMap);

    expect(mockMap.getSource('my-source')).toBeDefined();
    expect(mockMap.getLayer('my-layer')).toBeDefined();
    expect(mockMap.hasImage('my-image')).toBe(true);

    // The resources were actually re-added, not merely believed present.
    expect(mockMap.addSource.mock.calls.length).toBeGreaterThan(addSourceCalls);
    expect(mockMap.addLayer.mock.calls.length).toBeGreaterThan(addLayerCalls);
  });

  it('does not re-inject after the child is unmounted', async () => {
    const { mapEl, mockMap } = await mountLoadedMap();
    const source = await add<MapboxSource>(mapEl, sourceHtml(), 'MapboxSource');

    source.$unmount();
    await settle();

    const addSourceCalls = mockMap.addSource.mock.calls.length;
    await setStyle(mockMap);

    // An unmounted child unsubscribed from `style.load`: no resurrection.
    expect(mockMap.addSource.mock.calls.length).toBe(addSourceCalls);
    expect(mockMap.getSource('my-source')).toBeUndefined();
  });

  it('re-owns the resource after setStyle so its later teardown still removes it', async () => {
    const { mapEl, mockMap } = await mountLoadedMap();
    const source = await add<MapboxSource>(mapEl, sourceHtml(), 'MapboxSource');

    await setStyle(mockMap);
    expect(mockMap.getSource('my-source')).toBeDefined();

    // Ownership was re-claimed on re-injection, so teardown still cleans up.
    source.$unmount();
    await settle();
    expect(mockMap.getSource('my-source')).toBeUndefined();
  });

  it('recovers a still-mounted layer when its source is removed then re-added (H7 source-teardown case)', async () => {
    const { mapEl, mockMap } = await mountLoadedMap();
    const source = await add<MapboxSource>(mapEl, sourceHtml(), 'MapboxSource');
    await add<MapboxLayer>(mapEl, layerHtml(), 'MapboxLayer');
    expect(mockMap.getLayer('my-layer')).toBeDefined();

    // The source tears down (a `Fetch` swap of the source alone, say): it drops
    // every referencing layer — including this still-mounted one — then the
    // source itself.
    source.$unmount();
    await settle();
    expect(mockMap.getLayer('my-layer')).toBeUndefined();
    expect(mockMap.getSource('my-source')).toBeUndefined();

    // The source comes back later. The layer's standing `sourcedata` watch must
    // re-commit it rather than leaving it gone for good.
    await add<MapboxSource>(mapEl, sourceHtml(), 'MapboxSource');
    await settle();

    expect(mockMap.getSource('my-source')).toBeDefined();
    expect(mockMap.getLayer('my-layer')).toBeDefined();
  });
});

describe('MapboxCluster style-reload re-injection (H7)', () => {
  it('re-adds its source + layers after setStyle without duplicating listeners', async () => {
    const { mapEl, mockMap } = await mountLoadedMap();
    const cluster = await add<MapboxCluster>(
      mapEl,
      '<div data-component="MapboxCluster"></div>',
      'MapboxCluster',
    );

    function id(suffix: string) {
      return (cluster as unknown as { __getId(s: string): string }).__getId(suffix);
    }
    const sourceId = id('source');
    const clustersId = id('clusters');

    expect(mockMap.getSource(sourceId)).toBeDefined();
    expect(mockMap.getLayer(clustersId)).toBeDefined();
    // One click listener per clusters layer.
    expect(mockMap._listeners[`click:${clustersId}`]).toHaveLength(1);

    // setStyle wipes source + layers (but leaves the layer-scoped listeners),
    // then fires `style.load`. The cluster must re-add its source and layers and
    // must NOT stack a second copy of every listener.
    await setStyle(mockMap);

    expect(mockMap.getSource(sourceId)).toBeDefined();
    expect(mockMap.getLayer(clustersId)).toBeDefined();
    expect(mockMap._listeners[`click:${clustersId}`]).toHaveLength(1);
  });
});

describe('ownership staleness (H6)', () => {
  it('self-heals the registry across setStyle so a post-setStyle same-id resource is not misclassified', async () => {
    const { mapEl, mockMap } = await mountLoadedMap();
    const source = await add<MapboxSource>(mapEl, sourceHtml(), 'MapboxSource');

    // Snapshot the owner while live.
    expect(getMapboxOwner(mockMap, 'source:my-source')).toBe(source);

    // setStyle wipes the style but leaves the child mounted. Immediately after
    // the wipe — before re-injection would re-claim — a *stranger* re-adds a
    // source under the same id (as if by external code). Because the previous
    // owner's resource is gone, the registry entry is stale and must read as
    // unowned so nobody adopts the stranger's source.
    mockMap._sources = {};
    mockMap._layers = [];
    mockMap._images = {};
    mockMap.addSource('my-source', { type: 'geojson' });

    expect(getMapboxOwner(mockMap, 'source:my-source')).toBeUndefined();
  });

  it('external removeSource does not leave a stale owner that deletes a stranger later same-id source', async () => {
    const { mapEl, mockMap } = await mountLoadedMap();
    const source = await add<MapboxSource>(mapEl, sourceHtml(), 'MapboxSource');
    expect(mockMap.getSource('my-source')).toBeDefined();

    // External code removes the source out from under the component.
    mockMap.removeSource('my-source');

    // A stranger (non-family) re-adds a source under the same id.
    mockMap.addSource('my-source', { type: 'geojson' });
    const strangerSource = mockMap.getSource('my-source');

    // The stale owner must not be reported: the resource on the map is not the
    // one it added.
    expect(getMapboxOwner(mockMap, 'source:my-source')).toBeUndefined();

    // The original component tears down: it must NOT delete the stranger's
    // source (it no longer owns the id). The only `removeSource('my-source')`
    // call is the external one above — teardown adds none.
    const removeCallsBefore = mockMap.removeSource.mock.calls.length;
    source.$unmount();
    await settle();
    expect(mockMap.getSource('my-source')).toBe(strangerSource);
    expect(mockMap.removeSource.mock.calls.length).toBe(removeCallsBefore);
  });

  it('a new family source does not adopt a stranger source left after an external removeSource', async () => {
    const { mapEl, mockMap } = await mountLoadedMap();
    const source = await add<MapboxSource>(mapEl, sourceHtml(), 'MapboxSource');

    // External removeSource + a stranger re-adds under the same id.
    mockMap.removeSource('my-source');
    mockMap.addSource('my-source', { type: 'geojson' });
    const strangerSource = mockMap.getSource('my-source');
    source.$unmount();
    await settle();

    // A brand new family MapboxSource mounts on the same id. It sees the id
    // taken but unowned (the stale entry was pruned), so it must leave the
    // stranger's source untouched rather than adopting it.
    const newSource = await add<MapboxSource>(mapEl, sourceHtml(), 'MapboxSource');

    // Not adopted: still the stranger's object, and the new instance does not
    // own it.
    expect(mockMap.getSource('my-source')).toBe(strangerSource);
    expect(getMapboxOwner(mockMap, 'source:my-source')).toBeUndefined();

    // On teardown the new instance must not delete the stranger's source.
    newSource.$unmount();
    await settle();
    expect(mockMap.getSource('my-source')).toBe(strangerSource);
  });

  it('prunes a stale entry on read via the liveness probe', async () => {
    const { mockMap } = await mountLoadedMap();
    const ownerA = {};
    let live = true;
    claimMapboxOwnership(mockMap, 'source:x', ownerA, () => live);

    expect(getMapboxOwner(mockMap, 'source:x')).toBe(ownerA);

    // The owned resource disappears: the next read prunes the entry.
    live = false;
    expect(getMapboxOwner(mockMap, 'source:x')).toBeUndefined();
  });
});
