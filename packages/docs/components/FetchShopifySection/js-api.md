---
title: FetchShopifySection JS API
outline: deep
---

# JS API

The `FetchShopifySection` class extends the [`Fetch` class](../Fetch/js-api.md). It appends the configured section IDs to the request URL and unwraps the Section Rendering API JSON response. All [`Fetch` options](../Fetch/js-api.md#options), getters, methods and events are inherited; the additions and differences are documented below.

## Options

### `sections`

- Type: `string[]`
- Default: `[]`

The IDs of the Shopify sections to refresh, matching the `sections` parameter of the [Section Rendering API](https://shopify.dev/docs/api/ajax/section-rendering) (up to five). Provide them as a JSON array in the `data-option-sections` attribute. They are appended to the request URL as a comma-separated `sections` parameter, leaving the element's `href`/`action` untouched so it keeps working without JavaScript.

```html
<a
  href="/collections/all"
  data-component="FetchShopifySection"
  data-option-sections='["main-collection-product-grid"]'>
  Refresh
</a>
```

### `response`

- Type: `string`
- Default: `response.json().then((sections) => Object.values(sections).filter(Boolean).join(''))`

Overrides the base [`response`](../Fetch/js-api.md#response) default to unwrap the Section Rendering JSON object (`{ [id]: html }`) into the concatenated section HTML, dropping any section returned as `null` through `filter(Boolean)`. Each section is then swapped in place by the inherited [`[id]` selector](../Fetch/js-api.md#selector). Override it if you need custom extraction.

## Getters

### `url`

Extends the base [`url`](../Fetch/js-api.md#url) getter: when at least one section is configured, the [`sections` option](#sections) is appended to the resolved URL as the comma-separated `sections` query parameter.

## Methods

### `update(url, requestInit, content)`

Overrides the base [`update`](../Fetch/js-api.md#fetch-url-string-requestinit-requestinit) to remove the `sections` parameter from the URL before delegating to `Fetch`, so — when the [`history` option](../Fetch/js-api.md#history) is enabled — the address bar reflects the human-facing page and not the raw Section Rendering endpoint.
