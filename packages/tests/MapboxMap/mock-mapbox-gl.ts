import { vi } from 'vitest';

export class MockMap {
  _listeners: Record<string, Function[]> = {};

  on(event: string, fn: Function) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
    return this;
  }
  off(event: string, fn: Function) {
    this._listeners[event] = (this._listeners[event] || []).filter((f) => f !== fn);
    return this;
  }
  fire(event: string, data?: any) {
    (this._listeners[event] || []).forEach((fn) => fn(data));
  }
  remove = vi.fn();
  addControl = vi.fn();
  removeControl = vi.fn();
  addLayer = vi.fn();
  removeLayer = vi.fn();
  getLayer = vi.fn();
}

export class MockMarker {
  _lngLat: any;
  _popup: any;
  setLngLat = vi.fn(function (this: MockMarker, lngLat: any) { this._lngLat = lngLat; return this; });
  addTo = vi.fn(function (this: MockMarker) { return this; });
  remove = vi.fn();
  setPopup = vi.fn(function (this: MockMarker, popup: any) { this._popup = popup; return this; });
}

export class MockPopup {
  _lngLat: any;
  setLngLat = vi.fn(function (this: MockPopup, lngLat: any) { this._lngLat = lngLat; return this; });
  setDOMContent = vi.fn(function (this: MockPopup) { return this; });
  setHTML = vi.fn(function (this: MockPopup) { return this; });
  addTo = vi.fn(function (this: MockPopup) { return this; });
  remove = vi.fn();
}

export class MockNavigationControl {}
export class MockGeolocateControl {}

vi.mock('mapbox-gl', () => ({
  Map: MockMap,
  Marker: MockMarker,
  Popup: MockPopup,
  NavigationControl: MockNavigationControl,
  GeolocateControl: MockGeolocateControl,
  default: {
    Map: MockMap,
    Marker: MockMarker,
    Popup: MockPopup,
    NavigationControl: MockNavigationControl,
    GeolocateControl: MockGeolocateControl,
  },
}));

vi.mock('@mapbox/mapbox-gl-geocoder', () => {
  class MockGeocoder {
    addTo = vi.fn();
  }
  return { default: MockGeocoder };
});
