import { vi } from 'vitest';

export class MockMap {
  /**
   * Count how many `MockMap` instances have been constructed. Lets tests assert
   * that teardown does not construct a map through the lazy `get map()` getter.
   */
  static instanceCount = 0;

  _listeners: Record<string, Function[]> = {};
  _sources: Record<string, any> = {};
  _layers: any[] = [];
  _images: Record<string, any> = {};
  _options: any;

  constructor(options?: any) {
    this._options = options;
    MockMap.instanceCount += 1;
  }

  /**
   * Register a listener. Supports both the global `(event, fn)` signature and
   * the layer scoped `(event, layerId, fn)` signature used by `MapboxCluster`.
   */
  on(event: string, arg2: string | Function, arg3?: Function) {
    const [layer, fn] =
      typeof arg2 === 'function' ? [null, arg2] : [arg2, arg3 as Function];
    const key = layer ? `${event}:${layer}` : event;
    if (!this._listeners[key]) this._listeners[key] = [];
    this._listeners[key].push(fn);
    return this;
  }

  off(event: string, arg2: string | Function, arg3?: Function) {
    const [layer, fn] =
      typeof arg2 === 'function' ? [null, arg2] : [arg2, arg3 as Function];
    const key = layer ? `${event}:${layer}` : event;
    this._listeners[key] = (this._listeners[key] || []).filter((f) => f !== fn);
    return this;
  }

  /**
   * Fire a listener. Supports both `(event, data)` for global listeners and
   * `(event, layerId, data)` for layer scoped listeners.
   */
  fire(event: string, arg2?: any, arg3?: any) {
    if (typeof arg2 === 'string') {
      const key = `${event}:${arg2}`;
      (this._listeners[key] || []).forEach((fn) => fn(arg3));
    } else {
      (this._listeners[event] || []).forEach((fn) => fn(arg2));
    }
  }

  remove = vi.fn();
  addControl = vi.fn();
  removeControl = vi.fn();

  addLayer = vi.fn((layer: any, _beforeId?: string) => {
    this._layers.push(layer);
  });
  removeLayer = vi.fn((id: string) => {
    this._layers = this._layers.filter((layer) => layer.id !== id);
  });
  getLayer = vi.fn((id: string) => this._layers.find((layer) => layer.id === id));

  addSource = vi.fn((id: string, source: any) => {
    this._sources[id] = {
      ...source,
      getClusterExpansionZoom: vi.fn((_clusterId: number, cb: Function) => cb(null, 5)),
    };
  });
  removeSource = vi.fn((id: string) => {
    delete this._sources[id];
  });
  getSource = vi.fn((id: string) => this._sources[id]);
  getStyle = vi.fn(() => ({ layers: this._layers }));

  queryRenderedFeatures = vi.fn(() => [] as any[]);
  getCanvas = vi.fn(() => ({ style: {} as Record<string, string> }));
  easeTo = vi.fn();

  loadImage = vi.fn((_url: string, cb: Function) => cb(null, {}));
  addImage = vi.fn((name: string, image: any, _options?: any) => {
    this._images[name] = image;
  });
  hasImage = vi.fn((name: string) => name in this._images);
  removeImage = vi.fn((name: string) => {
    delete this._images[name];
  });

  /**
   * Seed a sprite as if it had been registered by someone other than the
   * component under test. `hasImage` is backed by `_images`, so a seeded sprite
   * makes `hasImage(name)` return `true` without the component having added it,
   * letting tests exercise ownership-aware teardown.
   */
  seedImage(name: string, image: any = {}) {
    this._images[name] = image;
  }
}

export class MockMarker {
  /**
   * Count how many `MockMarker` instances have been constructed. Lets tests
   * assert that teardown does not construct a marker through the lazy
   * `get marker()` getter.
   */
  static instanceCount = 0;

  _lngLat: any;
  _popup: any;
  constructor() {
    MockMarker.instanceCount += 1;
  }
  setLngLat = vi.fn(function (this: MockMarker, lngLat: any) {
    this._lngLat = lngLat;
    return this;
  });
  addTo = vi.fn(function (this: MockMarker) {
    return this;
  });
  remove = vi.fn();
  setPopup = vi.fn(function (this: MockMarker, popup: any) {
    this._popup = popup;
    return this;
  });
}

export class MockPopup {
  /**
   * Count how many `MockPopup` instances have been constructed. Lets tests
   * assert that teardown does not construct a popup through the lazy
   * `get popup()` getter.
   */
  static instanceCount = 0;

  _lngLat: any;
  _options: any;
  constructor(options?: any) {
    this._options = options;
    MockPopup.instanceCount += 1;
  }
  setLngLat = vi.fn(function (this: MockPopup, lngLat: any) {
    this._lngLat = lngLat;
    return this;
  });
  setDOMContent = vi.fn(function (this: MockPopup) {
    return this;
  });
  setHTML = vi.fn(function (this: MockPopup) {
    return this;
  });
  addTo = vi.fn(function (this: MockPopup) {
    return this;
  });
  remove = vi.fn();
}

export class MockNavigationControl {
  /**
   * Count how many `MockNavigationControl` instances have been constructed. Lets
   * tests assert that teardown does not construct a control through the lazy
   * `get control()` getter.
   */
  static instanceCount = 0;

  constructor() {
    MockNavigationControl.instanceCount += 1;
  }
}
export class MockGeolocateControl {}
export class MockFullscreenControl {}

vi.mock('mapbox-gl', () => ({
  default: {
    Map: MockMap,
    Marker: MockMarker,
    Popup: MockPopup,
    NavigationControl: MockNavigationControl,
    GeolocateControl: MockGeolocateControl,
    FullscreenControl: MockFullscreenControl,
  },
}));

vi.mock('@mapbox/mapbox-gl-geocoder', () => {
  class MockGeocoder {
    addTo = vi.fn();
    onRemove = vi.fn();
  }
  return { default: MockGeocoder };
});
