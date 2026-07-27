---
title: FetchShopifySection JS API
outline: deep
---

# JS API

The `FetchShopifySection` class extends the [`Fetch` class](../Fetch/js-api.md). It appends the configured section IDs to the request URL and unwraps the Section Rendering API JSON response. All [`Fetch` options](../Fetch/js-api.md#options), getters, methods and events are inherited; the additions and differences are documented below.

## Options

### `sections`

- Type: `string`
- Default: `''`

The IDs of the Shopify sections to refresh, matching the `sections` parameter of the [Section Rendering API](https://shopify.dev/docs/api/ajax/section-rendering) (up to five). Provide them as a comma-separated list in the `data-option-sections` attribute; surrounding whitespace is trimmed. They are appended to the request URL as the comma-separated `sections` parameter, leaving the element's `href`/`action` untouched so it keeps working without JavaScript.

```html
<a
  href="/collections/all"
  data-component="FetchShopifySection"
  data-option-sections="main-collection-product-grid,collection-results-count">
  Refresh
</a>
```

### `response`

`FetchShopifySection` does **not** override the base [`response`](../Fetch/js-api.md#response) option — it keeps the inherited default (`response.text()`). The Section Rendering JSON is unwrapped by the [`__parseResponse()`](#parseresponse-response-url-requestinit) method instead. Set `data-option-response` to supply a custom extraction: doing so disables the JSON unwrap and makes the component parse the response exactly like the base [`Fetch`](../Fetch/js-api.md#response).

## Getters

### `url`

Extends the base [`url`](../Fetch/js-api.md#url) getter: when at least one section is configured, the [`sections` option](#sections) is appended to the resolved URL as the comma-separated `sections` query parameter.

## Methods

### `fetch(url, requestInit)`

Overrides the base [`fetch`](../Fetch/js-api.md#fetch-url-string-requestinit-requestinit) to re-append the [`sections` option](#sections) to the request URL before delegating to `Fetch`. This covers callers that pass an explicit URL and so bypass the [`url`](#url) getter — most importantly the inherited `onWindowPopstate()` handler, which on back/forward navigation replays the clean, section-free history URL. Without this, popstate-driven requests would hit the human-facing page (HTML) instead of the Section Rendering endpoint (JSON).

### `__parseResponse(response, url, requestInit)`

Unwraps the Section Rendering JSON object (`{ [id]: html }`) into the concatenated section HTML, dropping any section returned as `null` through `filter(Boolean)`. Each section is then swapped in place by the inherited [`[id]` selector](../Fetch/js-api.md#selector). The unwrap is skipped — deferring to the base [`Fetch`](../Fetch/js-api.md), which evaluates the [`response`](#response) option — when no `sections` are configured (a normal HTML page is requested) or when a custom `response` option is supplied.

### `update(url, requestInit, content)`

Overrides the base `update` to remove the `sections` parameter from the URL before delegating to `Fetch`, so — when the [`history` option](../Fetch/js-api.md#history) is enabled — the address bar reflects the human-facing page and not the raw Section Rendering endpoint.
