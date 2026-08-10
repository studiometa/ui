import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';
import { MockMap } from './mock-mapbox-gl.js';
import { MapboxSource, MapboxLayer, MapboxImage, MapboxCluster } from '@studiometa/ui-mapbox';
import { claimMapboxOwnership, getMapboxOwner } from '@studiometa/ui-mapbox/utils';

/**
 * Bind a child instance to a shared, already-loaded `MockMap` through a mocked
 * `$closest`, mirroring how the async component resolution would.
 */
function bind(instance: any, mockMap: MockMap) {
  instance.$closest = vi.fn((query: string) =>
    query === 'MapboxMap'
      ? ({ map: mockMap, isLoaded: true, $options: { accessToken: 'token' } } as any)
      : undefined,
  );
}

async function mount(instance: any) {
  vi.useFakeTimers();
  instance.$mount();
  await vi.advanceTimersByTimeAsync(100);
  vi.useRealTimers();
}

async function destroy(instance: any) {
  vi.useFakeTimers();
  instance.$destroy();
  await vi.advanceTimersByTimeAsync(100);
  vi.useRealTimers();
}

function makeSource(mockMap: MockMap, id = 'my-source') {
  const el = h('div', {
    'data-component': 'MapboxSource',
    'data-option-id': id,
    'data-option-source': '{"type":"geojson","data":{"type":"FeatureCollection","features":[]}}',
  });
  const instance = new MapboxSource(el);
  bind(instance, mockMap);
  return instance;
}

function makeLayer(mockMap: MockMap, id = 'my-layer', source = 'my-source') {
  const el = h('div', {
    'data-component': 'MapboxLayer',
    'data-option-id': id,
    'data-option-layer': JSON.stringify({ type: 'fill', source }),
  });
  const instance = new MapboxLayer(el);
  bind(instance, mockMap);
  return instance;
}

function makeImage(mockMap: MockMap, name = 'my-image') {
  const el = h('div', {
    'data-component': 'MapboxImage',
    'data-option-name': name,
    'data-option-url': 'https://example.test/icon.png',
  });
  const instance = new MapboxImage(el);
  bind(instance, mockMap);
  return instance;
}

describe('style-reload re-injection (H7)', () => {
  it('re-injects a mounted MapboxSource + MapboxLayer + MapboxImage after setStyle', async () => {
    const mockMap = new MockMap();
    const source = makeSource(mockMap);
    const layer = makeLayer(mockMap);
    const image = makeImage(mockMap);

    // Mount source first so its `style.load` handler runs before the layer's;
    // either order works (the layer's standing `sourcedata` watch recovers too).
    await mount(source);
    await mount(layer);
    await mount(image);

    // Everything is on the initial style.
    expect(mockMap.getSource('my-source')).toBeDefined();
    expect(mockMap.getLayer('my-layer')).toBeDefined();
    expect(mockMap.hasImage('my-image')).toBe(true);

    const addSourceCalls = mockMap.addSource.mock.calls.length;
    const addLayerCalls = mockMap.addLayer.mock.calls.length;

    // A full style replacement wipes sources, layers and sprites, then fires
    // `style.load`. The mounted children must re-inject onto the new style.
    mockMap.setStyle('mapbox://styles/mapbox/dark-v11');
    // Flush the microtask the layer defers its (re)commit to.
    await Promise.resolve();
    await Promise.resolve();
    // Flush the image's async re-add (loadImage + addImage).
    await Promise.resolve();
    await Promise.resolve();

    expect(mockMap.getSource('my-source')).toBeDefined();
    expect(mockMap.getLayer('my-layer')).toBeDefined();
    expect(mockMap.hasImage('my-image')).toBe(true);

    // The resources were actually re-added, not merely believed present.
    expect(mockMap.addSource.mock.calls.length).toBeGreaterThan(addSourceCalls);
    expect(mockMap.addLayer.mock.calls.length).toBeGreaterThan(addLayerCalls);
  });

  it('does not re-inject after the child is destroyed', async () => {
    const mockMap = new MockMap();
    const source = makeSource(mockMap);
    await mount(source);
    await destroy(source);

    const addSourceCalls = mockMap.addSource.mock.calls.length;
    mockMap.setStyle('mapbox://styles/mapbox/dark-v11');

    // A destroyed child unsubscribed from `style.load`: no resurrection.
    expect(mockMap.addSource.mock.calls.length).toBe(addSourceCalls);
    expect(mockMap.getSource('my-source')).toBeUndefined();
  });

  it('re-owns the resource after setStyle so its later teardown still removes it', async () => {
    const mockMap = new MockMap();
    const source = makeSource(mockMap);
    await mount(source);

    mockMap.setStyle('mapbox://styles/mapbox/dark-v11');
    expect(mockMap.getSource('my-source')).toBeDefined();

    // Ownership was re-claimed on re-injection, so teardown still cleans up.
    await destroy(source);
    expect(mockMap.getSource('my-source')).toBeUndefined();
  });

  it('recovers a still-mounted layer when its source is removed then re-added (H7 source-teardown case)', async () => {
    const mockMap = new MockMap();
    const source = makeSource(mockMap);
    const layer = makeLayer(mockMap);

    await mount(source);
    await mount(layer);
    expect(mockMap.getLayer('my-layer')).toBeDefined();

    // The source tears down (a `Fetch` swap of the source alone, say): it drops
    // every referencing layer — including this still-mounted one — then the
    // source itself.
    await destroy(source);
    expect(mockMap.getLayer('my-layer')).toBeUndefined();
    expect(mockMap.getSource('my-source')).toBeUndefined();

    // The source comes back later. The layer's standing `sourcedata` watch must
    // re-commit it rather than leaving it gone for good.
    const source2 = makeSource(mockMap);
    await mount(source2);
    await Promise.resolve();
    await Promise.resolve();

    expect(mockMap.getSource('my-source')).toBeDefined();
    expect(mockMap.getLayer('my-layer')).toBeDefined();
  });
});

describe('MapboxCluster style-reload re-injection (H7)', () => {
  it('re-adds its source + layers after setStyle without duplicating listeners', async () => {
    const mockMap = new MockMap();
    const el = h('div', { 'data-component': 'MapboxCluster' });
    const cluster = new MapboxCluster(el);
    bind(cluster, mockMap);

    vi.useFakeTimers();
    cluster.$mount();
    await vi.advanceTimersByTimeAsync(200);
    vi.useRealTimers();

    const sourceId = (cluster as any).__getId('source');
    const clustersId = (cluster as any).__getId('clusters');

    expect(mockMap.getSource(sourceId)).toBeDefined();
    expect(mockMap.getLayer(clustersId)).toBeDefined();
    // One click listener per clusters layer.
    expect(mockMap._listeners[`click:${clustersId}`]).toHaveLength(1);

    // setStyle wipes source + layers (but leaves the layer-scoped listeners),
    // then fires `style.load`. The cluster must re-add its source and layers and
    // must NOT stack a second copy of every listener.
    mockMap.setStyle('mapbox://styles/mapbox/dark-v11');

    expect(mockMap.getSource(sourceId)).toBeDefined();
    expect(mockMap.getLayer(clustersId)).toBeDefined();
    expect(mockMap._listeners[`click:${clustersId}`]).toHaveLength(1);
  });
});

describe('ownership staleness (H6)', () => {
  it('self-heals the registry across setStyle so a post-setStyle same-id resource is not misclassified', async () => {
    const mockMap = new MockMap();
    const source = makeSource(mockMap);
    await mount(source);

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
    const mockMap = new MockMap();
    const source = makeSource(mockMap);
    await mount(source);
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
    await destroy(source);
    expect(mockMap.getSource('my-source')).toBe(strangerSource);
    expect(mockMap.removeSource.mock.calls.length).toBe(removeCallsBefore);
  });

  it('a new family source does not adopt a stranger source left after an external removeSource', async () => {
    const mockMap = new MockMap();
    const source = makeSource(mockMap);
    await mount(source);

    // External removeSource + a stranger re-adds under the same id.
    mockMap.removeSource('my-source');
    mockMap.addSource('my-source', { type: 'geojson' });
    const strangerSource = mockMap.getSource('my-source');
    await destroy(source);

    // A brand new family MapboxSource mounts on the same id. It sees the id
    // taken but unowned (the stale entry was pruned), so it must leave the
    // stranger's source untouched rather than adopting it.
    const newSource = makeSource(mockMap);
    await mount(newSource);

    // Not adopted: still the stranger's object, and the new instance does not
    // own it.
    expect(mockMap.getSource('my-source')).toBe(strangerSource);
    expect(getMapboxOwner(mockMap, 'source:my-source')).toBeUndefined();

    // On teardown the new instance must not delete the stranger's source.
    await destroy(newSource);
    expect(mockMap.getSource('my-source')).toBe(strangerSource);
  });

  it('prunes a stale entry on read via the liveness probe', () => {
    const mockMap = new MockMap();
    const ownerA = {};
    let live = true;
    claimMapboxOwnership(mockMap, 'source:x', ownerA, () => live);

    expect(getMapboxOwner(mockMap, 'source:x')).toBe(ownerA);

    // The owned resource disappears: the next read prunes the entry.
    live = false;
    expect(getMapboxOwner(mockMap, 'source:x')).toBeUndefined();
  });
});
