---
title: MapboxStaticMap Twig API
---

# Twig API

## Parameters

:::tip Required parameter
The  [`access_token`](#access-token) parameter is required.
:::

All parameters from the [`Figure` component](/components/Figure/twig-api) are inherited.

### `access_token`

- Type: `string`
- Default: `'<MISSING_ACCESS_TOKEN>'`
- Required

Your Mapbox access token.

### `username`

- Type: `string`
- Default: `'mapbox'`

The username of the account to which the style belongs.

### `style_id`

- Type: `string`
- Default: `'streets-v12'`

The ID of the style from which to create a static map.

### `lon`

- Type: `number`
- Default: `0`

Longitude, a number between -180 and 180.

### `lat`

- Type: `number`
- Default: `0`

Latitude, a number between -85.0511 and 85.0511.

### `zoom`

- Type: `number`
- Default: `0`

Zoom level, a number between 0 and 22.

### `marker`

- Type: `string`

Add a custom marker, format: `'url-<URL_TO_IMAGE>(<LON>,<LAT>)'`.
see https://docs.mapbox.com/api/maps/static-images/#example-request-retrieve-a-static-map-with-a-custom-marker-overlay fore more informations.

### `overlay`

- Type: `object`

Add overlays/markers, must be a valid geojson object.
see https://docs.mapbox.com/api/maps/static-images/#overlay-options fore more informations.

### `bearing`

- Type: `number`
- Default: `0`

Rotates the map, a number between 0 and 360.

### `pitch`

- Type: `number`
- Default: `0`

Pitch tilts the map, between 0 and 60

### `is_hd`

- Type: `boolean`
- Default: `true`

Renders the map at @2x scale.

### `attribution`

- Type: `boolean`
- Default: `true`

Whether there is attribution on the image.
If you are setting this to `false` please read: https://docs.mapbox.com/help/getting-started/attribution/#static--print.

### `logo`

- Type: `boolean`
- Default: `true`

Whether there is a Mapbox logo.
