---
title: MapboxMap JS API
outline: deep
---

# JS API

This page documents thirteen components — a single root component, `MapboxMap`, which owns the Mapbox `Map` instance, plus the twelve children below — built on the `AbstractMapboxMapChild` (and, for controls, `AbstractMapboxControl`) base classes. The [`StoreLocator`](/components/StoreLocator/) orchestrator completes the family on its own page. Every child resolves the closest parent `MapboxMap` on its own and registers itself against its map once it is loaded.

[Register](/guide/usage/#registering-components) each component you use — ideally behind a lazy [`importWhen*` helper](https://js-toolkit.studiometa.dev/api/helpers/importWhenVisible.html) so the heavy `mapbox-gl` dependency stays out of your main bundle (see [Lazy loading](/components/MapboxMap/#lazy-loading)).

- **[Map](#map)** — `MapboxMap`
- **[Markers & Popups](#markers-popups)** — `MapboxMarker`, `MapboxPopup`
- **[Controls](#controls)** — `MapboxNavigationControl`, `MapboxGeolocateControl`, `MapboxFullscreenControl`, `MapboxGeocoder`
- **[Data](#data)** — `MapboxSource`, `MapboxLayer`, `MapboxImage`, `MapboxImages`
- **[Cluster](#cluster)** — `MapboxCluster`, `MapboxClusterItem` (see also the [`StoreLocator`](/components/StoreLocator/) orchestrator)
- **[AbstractMapboxMapChild](#abstractmapboxmapchild)** — the shared base class

## Reactivity and updates

To move the map, change its data or update a marker after mount, reach for the underlying Mapbox objects directly through the component instances:

```js
import { getInstance } from '@studiometa/js-toolkit';

// The Mapbox `Map` instance is exposed on the `MapboxMap` component.
const mapboxMap = getInstance(element, MapboxMap);
mapboxMap.map.setCenter([2.35, 48.86]);
mapboxMap.map.setZoom(12);

// Markers, popups and sources expose their own Mapbox object too.
marker.marker.setLngLat([2.29, 48.86]);
```

Every component documents the Mapbox object it exposes (`map`, `marker`, `popup`, `control`, …) in its **Getters** section below.

::: tip Switching base style keeps your layers
Calling `map.setStyle(…)` wipes the entire style — every source, layer and sprite — while the map instance and the still-mounted child components survive. Each map child subscribes to the map's `style.load` and **re-injects** its contribution automatically, so your declarative sources, layers, images and clusters re-appear on the new base style instead of silently vanishing. You can switch the base style at runtime without re-declaring your data.
:::

## Map

### MapboxMap

Display an interactive Mapbox GL map. This is the root component of the system and the parent of every other component. It instantiates the Mapbox `Map` lazily and re-emits its events.

#### Options

##### `access-token`

- Type: `String`

Mapbox GL [access token](https://docs.mapbox.com/help/getting-started/access-tokens/) (required).

##### `zoom`

- Type: `Number`

Initial zoom level.

##### `center`

- Type: `Array`
- Default: `[0, 0]`

Initial center as `[longitude, latitude]`.

##### `map-options`

- Type: `Object`
- Default: `{}`

Any other [Mapbox `Map` option](https://docs.mapbox.com/mapbox-gl-js/api/map/#map-parameters), spread into the constructor. This is where `style`, `pitch`, `bearing`, `bounds`, … go.

The `access-token`, `zoom` and `center` options act as overridable defaults, then `map-options` is spread into the [Mapbox `Map` constructor](https://docs.mapbox.com/mapbox-gl-js/api/map/#map-parameters). The `container` is always resolved from the component (the `container` ref, falling back to the root element) and can not be overridden. Use `map-options` for anything the convenience options above do not cover — most notably the map [`style`](https://docs.mapbox.com/mapbox-gl-js/api/map/#map-parameters):

```html
<div
  data-component="MapboxMap"
  data-option-access-token="pk.…"
  data-option-map-options='{ "style": "mapbox://styles/mapbox/streets-v12", "pitch": 45 }'>
  <div data-ref="container"></div>
</div>
```

#### Refs

##### `container`

- Type: `HTMLElement`

The element used as the map container. Falls back to the root element when omitted.

#### Getters

##### `map`

- Type: `mapboxgl.Map`

The underlying Mapbox GL map instance.

##### `isLoaded`

- Type: `boolean`

Whether the map has finished loading.

#### Events

The component emits a custom `map-load` event, plus all the common Mapbox GL map events, re-emitted under the same name. Each handler receives the corresponding Mapbox event object (the `map-load` handler receives the `map` instance).

##### `map-load`

The map finished loading (custom event).

##### `load`

Map resources are loaded.

##### `idle`

The map is idle after rendering.

##### `render`

A frame is rendered.

##### `resize`

The map container is resized.

##### `remove`

The map is removed.

##### `error`

An error occurred.

##### `click`

A click on the map.

##### `dblclick`

A double-click on the map.

##### `mouseenter`

The pointer enters the map canvas.

##### `mouseleave`

The pointer leaves the map canvas.

##### `mousemove`

The pointer moves over the map.

##### `movestart`

Map movement starts (pan, zoom, rotate).

##### `move`

The map is moving.

##### `moveend`

Map movement ends.

##### `zoomstart`

A zoom transition starts.

##### `zoom`

The zoom level changes.

##### `zoomend`

A zoom transition ends.

##### `rotatestart`

Rotation starts.

##### `rotate`

The map is rotating.

##### `rotateend`

Rotation ends.

##### `pitchstart`

A pitch transition starts.

##### `pitch`

The pitch changes.

##### `pitchend`

A pitch transition ends.

##### `dragstart`

A drag starts.

##### `drag`

The map is being dragged.

##### `dragend`

A drag ends.

Listen to these events from a parent component with `on<ComponentName><EventName>` methods:

```js
import { Base, createApp } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui-mapbox';

class App extends Base {
  static config = {
    name: 'App',
    components: { MapboxMap },
  };

  onMapboxMapMapLoad(map) {
    console.log('Map is ready', map);
  }

  onMapboxMapClick(event) {
    console.log('Clicked at', event.lngLat);
  }

  onMapboxMapZoomend(event) {
    console.log('New zoom level', event.target.getZoom());
  }
}

createApp(App);
```

## Markers & Popups

### MapboxMarker

Add a [marker](https://docs.mapbox.com/mapbox-gl-js/api/markers/#marker) to the map. A `MapboxPopup` nested inside the marker is automatically attached to it.

#### Options

##### `lng-lat`

- Type: `Array`
- Default: `[0, 0]`

Marker position as `[longitude, latitude]`.

##### `marker-options`

- Type: `Object`
- Default: `{}`

[Mapbox Marker options](https://docs.mapbox.com/mapbox-gl-js/api/markers/#marker) (color, anchor, draggable, …).

#### Getters

##### `marker`

- Type: `mapboxgl.Marker`

The underlying Marker instance.

##### `popup`

- Type: `MapboxPopup`

The first nested `MapboxPopup` child, if any.

### MapboxPopup

Display a [popup](https://docs.mapbox.com/mapbox-gl-js/api/markers/#popup) on the map. It can be used standalone (placed directly on the map at a given position) or nested inside a `MapboxMarker` (attached to the marker, no `lng-lat` needed). The popup content is taken from the element's inner HTML.

#### Options

##### `lng-lat`

- Type: `Array`
- Default: `[0, 0]`

Popup position as `[longitude, latitude]` (standalone popups only).

##### `popup-options`

- Type: `Object`
- Default: `{}`

[Mapbox Popup options](https://docs.mapbox.com/mapbox-gl-js/api/markers/#popup).

#### Getters

##### `popup`

- Type: `mapboxgl.Popup`

The underlying Popup instance.

## Controls

All controls extend [`AbstractMapboxMapChild`](#abstractmapboxmapchild) and expose the underlying Mapbox control through a `control` getter. They share a `position` option and are added to the map on mount, removed on destroy.

### MapboxNavigationControl

Add zoom in/out and compass controls to the map.

#### Options

##### `position`

- Type: `String`
- Default: `'top-right'`

Control position: `top-left`, `top-right`, `bottom-left` or `bottom-right`.

##### `show-compass`

- Type: `Boolean`
- Default: `false`

Show the compass button.

##### `show-zoom`

- Type: `Boolean`
- Default: `false`

Show the zoom in/out buttons.

##### `visualize-pitch`

- Type: `Boolean`
- Default: `false`

Visualize the pitch on the compass button.

### MapboxGeolocateControl

Add a button that uses the browser's geolocation API to locate the user on the map.

#### Options

##### `position`

- Type: `String`
- Default: `'top-right'`

Control position.

##### `position-options`

- Type: `Object`

Browser [`PositionOptions`](https://developer.mozilla.org/en-US/docs/Web/API/PositionOptions).

##### `fit-bounds-options`

- Type: `Object`

[`FitBoundsOptions`](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#fitbounds) used when tracking.

##### `track-user-location`

- Type: `Boolean`
- Default: `false`

Continuously track the user location.

##### `show-accuracy-circle`

- Type: `Boolean`
- Default: `false`

Show the accuracy circle around the user location.

##### `show-user-location`

- Type: `Boolean`
- Default: `false`

Show the user location dot.

##### `show-user-heading`

- Type: `Boolean`
- Default: `false`

Show the user heading indicator.

### MapboxFullscreenControl

Add a button that toggles the map fullscreen.

#### Options

##### `position`

- Type: `String`
- Default: `'top-right'`

Control position.

### MapboxGeocoder

Add an address search control powered by [`@mapbox/mapbox-gl-geocoder`](https://github.com/mapbox/mapbox-gl-geocoder). Install the optional `@mapbox/mapbox-gl-geocoder` peer dependency to use it.

::: tip Optional, loaded on demand
`@mapbox/mapbox-gl-geocoder` is an optional peer dependency. It is loaded lazily with a dynamic `import()` when a `MapboxGeocoder` mounts, so the rest of the package works without it installed. If you use this component, add it to your project: `npm install @mapbox/mapbox-gl-geocoder`.
:::

#### Options

##### `add-to-map`

- Type: `Boolean`
- Default: `false`

Add the geocoder to the map as a control. Otherwise it is rendered inside the component's element.

##### `options`

- Type: `Object`
- Default: `{}`

[Geocoder options](https://github.com/mapbox/mapbox-gl-geocoder/blob/master/API.md#parameters). Non-serializable options (`filter`, `externalGeocoder`, `render`, `getItemValue`, `localGeocoder`) are not supported.

The `accessToken` is inherited from the parent `MapboxMap` when it is not set in `options`.

#### Getters

##### `control`

- Type: `MapboxGeocoder`

The underlying `mapbox-gl-geocoder` control instance.

##### `target`

- Type: `Map | HTMLElement`

Where the control is mounted, depending on `add-to-map`.

#### Events

##### `result`

- Payload: `result`

Emitted when the geocoder resolves an address, carrying the geocoder's `result` (its selected feature).

## Data

### MapboxSource

Add a [source](https://docs.mapbox.com/style-spec/reference/sources/) to the map. On destroy, every layer tied to the source is removed before the source itself.

#### Options

##### `id`

- Type: `String`

Unique source id, referenced by layers.

##### `source`

- Type: `Object`

A [source specification](https://docs.mapbox.com/style-spec/reference/sources/), e.g. `{ "type": "geojson", "data": … }`.

#### Refs

##### `geojson`

- Type: `HTMLScriptElement`

Optional `<script data-ref="geojson" type="application/json">` element holding inline GeoJSON. When present, its parsed content is injected as the source spec's `data`. Invalid JSON is ignored with a warning.

#### Getters

##### `source`

- Type: `SourceSpecification`

The resolved source specification, with the `geojson` ref's inline data injected as `data` when present.

### MapboxLayer

Add a [layer](https://docs.mapbox.com/style-spec/reference/layers/) to the map.

#### Options

##### `id`

- Type: `String`

Unique layer id. It is assigned to the `layer` specification on mount.

##### `layer`

- Type: `Object`

A [layer specification](https://docs.mapbox.com/style-spec/reference/layers/).

##### `before-id`

- Type: `String`

Insert the layer before this existing layer id.

### MapboxImage

Load a single image and register it against the map sprite so it can be referenced from a symbol layer's `icon-image`.

#### Options

##### `name`

- Type: `String`

The id under which the image is registered in the sprite.

##### `url`

- Type: `String`

The URL of the image (png, webp or jpg).

##### `options`

- Type: `Object`
- Default: `{ pixelRatio: 1, sdf: false }`

Options forwarded to [`map.addImage`](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addimage).

#### Events

##### `ready`

- Payload: `{ name, image, options }`

Emitted once the image has been loaded and added to the sprite.

### MapboxImages

Load and register a list of images against the map sprite in one component.

#### Options

##### `sources`

- Type: `Array`
- Default: `[]`

A list of image definitions, each `{ name, url, options? }`. See [`MapboxImage`](#mapboximage) options.

#### Events

##### `ready`

- Payload: `MapboxImage[]`

Emitted once every image has been loaded and added.

## Cluster

### MapboxCluster

A clustered GeoJSON **source driver** whose features ARE its rendered items. The `MapboxClusterItem`s living in its subtree self-register, and the cluster derives its clustered GeoJSON source from that registry — the same markup drives both a sidebar list and the clustered points on the map. It sets up the clustered source, the cluster circles layer, the cluster count labels layer and the unclustered points layer, together with the click-to-zoom interaction on clusters and pointer feedback on features.

The cluster is deliberately thin: it owns only the map data and the clustering interaction. It does **not** select, fly to, filter by viewport or open popups — those search-UX concerns belong to the optional [`StoreLocator`](/components/StoreLocator/) orchestrator, which drives them on top of a cluster. Used on its own, a `MapboxCluster` still renders a working clustered map + list; it simply reports a click on an unclustered point through the `item-click` event and lets the caller decide what it means.

#### Options

##### `cluster-max-zoom`

- Type: `Number`
- Default: `14`

Max zoom at which points are clustered.

##### `cluster-radius`

- Type: `Number`
- Default: `50`

Radius of each cluster when clustering points.

##### `cluster-min-points`

- Type: `Number`
- Default: `2`

Minimum number of points to form a cluster.

##### `cluster-properties`

- Type: `Object`
- Default: `{}`

Custom [cluster properties](https://docs.mapbox.com/style-spec/reference/sources/#geojson-clusterProperties).

##### `clusters-layout`

- Type: `Object`
- Default: `{}`

Layout for the clusters circle layer.

##### `clusters-paint`

- Type: `Object`
- Default: `{ 'circle-color': '#000', 'circle-radius': 40 }`

Paint for the clusters circle layer.

##### `cluster-count-layout`

- Type: `Object`
- Default: `{ 'text-field': ['get', 'point_count_abbreviated'] }`

Layout for the cluster count labels.

##### `cluster-count-paint`

- Type: `Object`
- Default: `{ 'text-color': 'white' }`

Paint for the cluster count labels.

##### `unclustered-point-layer-type`

- Type: `String`
- Default: `'circle'`

Type of the unclustered points layer.

##### `unclustered-point-layout`

- Type: `Object`
- Default: `{}`

Layout for the unclustered points layer.

##### `unclustered-point-paint`

- Type: `Object`
- Default: `{ 'circle-color': '#000', 'circle-radius': 4 }`

Paint for the unclustered points layer.

#### Getters

##### `items`

- Type: `MapboxClusterItem[]`

The registered items, in registration order — the read-only surface for an orchestrator.

##### `featureCollection`

- Type: `FeatureCollection`

The GeoJSON derived from the registered items — the data pushed to the source.

#### Methods

##### `register(item)`

Register a `MapboxClusterItem` and schedule a coalesced rebuild. Called automatically by items on mount.

##### `unregister(item)`

Unregister a `MapboxClusterItem` and schedule a coalesced rebuild. Called automatically by items on destroy.

##### `setData(data)`

Replace the live source data directly, bypassing the item registry — for imperative control. Safe before mount or after teardown.

#### Events

##### `cluster-click`

- Payload: `(clusterId, event)`

A cluster was clicked. Call `event.preventDefault()` to skip the default zoom-to-cluster behavior.

##### `item-click`

- Payload: `(item, feature, event)`

An unclustered point was clicked. `item` is the registered `MapboxClusterItem` behind the feature, or `undefined` when none could be resolved.

##### `update`

- Payload: `(items)`

The item set changed (a rebuild ran). Carries the live item set so an orchestrator can re-fit and re-filter.

### MapboxClusterItem

A single entry of a `MapboxCluster` — at once a rendered list item AND a map feature. It resolves the closest `MapboxCluster` ancestor, pushes itself into its registry on mount (`register`) and pulls itself out on destroy (`unregister`), so the cluster never has to query for its children. It is headless and passive: it never selects itself — a [`StoreLocator`](/components/StoreLocator/) orchestrator (when one wraps the cluster) drives its state setters.

#### Options

##### `id`

- Type: `String`

Stable identifier, used to match a clicked map feature back to the item.

##### `lng-lat`

- Type: `Array`
- Default: `[0, 0]`

The point coordinates as `[longitude, latitude]`.

##### `properties`

- Type: `Object`
- Default: `{}`

Extra feature properties merged into the item's GeoJSON feature.

#### Refs

##### `popup`

- Type: `HTMLElement`

Optional. Its inner HTML is used as the popup content on selection; otherwise the item's whole inner HTML is used as a fallback.

#### Getters

##### `id`

- Type: `string`

The item's stable identifier.

##### `lngLat`

- Type: `[number, number]`

The item's `[lng, lat]` coordinates.

##### `properties`

- Type: `Record<string, unknown>`

The extra feature properties.

##### `popupContent`

- Type: `string`

The HTML used as the popup content when selected.

#### Methods

The state setters below are called by a `StoreLocator` orchestrator; you generally read the resulting data-attributes from CSS rather than calling them yourself.

##### `setInBounds(value)`

Toggle the `data-in-bounds` attribute — the list-visibility signal.

##### `setActive(value)`

Toggle the `data-active` attribute and the `aria-current="true"` state — the selected signal.

## AbstractMapboxMapChild

The base class every child component extends (controls extend `AbstractMapboxControl`, itself a thin subclass that adds the shared `position` option and the `map.addControl`/`removeControl` lifecycle). It resolves the closest parent `MapboxMap` and exposes its Mapbox `Map` instance so children can register themselves against it. Beyond `mapboxMap`/`map`, it hardens the whole family's lifecycle: guarded injection and teardown, dead-map safety, retryable parent resolution (a child mounted before its map re-resolves on `mapbox-map:connected`), and automatic re-injection after a `map.setStyle(…)`. Extend it to build your own map children.

#### Getters

##### `mapboxMap`

- Type: `MapboxMap`

The closest parent `MapboxMap` component instance.

##### `map`

- Type: `mapboxgl.Map`

The Mapbox `Map` instance of the parent map.

```js
import { AbstractMapboxMapChild } from '@studiometa/ui-mapbox';

export class MyMapChild extends AbstractMapboxMapChild {
  static config = {
    name: 'MyMapChild',
  };

  mounted() {
    // `this.map` is the fully loaded Mapbox `Map` instance.
    this.map.addLayer(/* … */);
  }
}
```
