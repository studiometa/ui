---
title: Track JS API
outline: deep
---

# JS API

The `Track` class extends the [`Base` class](https://js-toolkit.studiometa.dev/api/) with the [`withIntersectionObserver` decorator](https://js-toolkit.studiometa.dev/api/decorators/withIntersectionObserver.html).

## Refs

### `payload`

A `<script type="application/json">` element whose content is parsed and sent as the payload of the published events. If the JSON is invalid, an empty payload is used and a warning is displayed in debug mode.

```html
<script data-ref="payload" type="application/json">
  { "name": "bloc-name" }
</script>
```

## Options

### `viewedEvent`

- Type: `string`
- Default: `'bento_section_viewed'`

The name of the event published the first time the root element enters the viewport.

### `clickedEvent`

- Type: `string`
- Default: `'bento_section_clicked'`

The name of the event published when the root element is clicked. In addition to the payload, the published data contains:

- `url`: the current page URL
- `target`: the lowercase tag name of the clicked element
- `target_content`: the text content of the clicked element, trimmed and truncated to 100 characters

### `intersectionObserver`

- Type: `IntersectionObserverInit`
- Default: `{ threshold: 0 }`

Options for the `IntersectionObserver` instance used to detect the visibility of the root element.

## Properties

### `payload`

- Type: `Record<string, unknown>`

The payload parsed from the [`payload` ref](#payload).

### `hasBeenViewed`

- Type: `boolean`

Whether the viewed event has already been published.

## Methods

### `publish`

Publish an event with the `Shopify.analytics.publish` API. A warning is displayed in debug mode when the API is not available.

**Parameters**

- `name` (`string`): the name of the event
- `payload` (`Record<string, unknown>`): the data sent with the event
