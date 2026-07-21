---
title: ShopifyPartialsFetch JS API
outline: deep
---

# JS API

The `ShopifyPartialsFetch` class extends the [`Fetch` class](../Fetch/js-api.md) and delegates fetching and DOM updates to Shopify's [`@shopify/partial-rendering`](https://www.npmjs.com/package/@shopify/partial-rendering) package when partials are configured. All [`Fetch` options](../Fetch/js-api.md#options), getters, methods and events are inherited; the additions and differences are documented below.

## Options

### `partials`

- Type: `string[]`
- Default: `[]`

The names of the Shopify partials to refresh, matching the names used in the corresponding `{% partial %}` tags. Provide them as a JSON array in the `data-option-partials` attribute. When the list is empty, the component falls back to the base [`Fetch`](../Fetch/index.md) behaviour.

```html
<a
  href="/collections/all"
  data-component="ShopifyPartialsFetch"
  data-option-partials='["product-grid", "product-count"]'>
  Refresh
</a>
```

## Behaviour

### Fallback to Fetch

The Shopify partial rendering path is used only when the [`partials` option](#partials) lists at least one name **and** the `@shopify/partial-rendering` package resolves. In every other case the component behaves exactly like the base [`Fetch`](../Fetch/index.md) component and swaps content by matching `id` attributes from a full response. It falls back to `Fetch` when:

- no partial is configured, or the package is not installed;
- the request cannot be expressed as a plain `GET` — because the partials API only fetches a URL, a `method="post"` form (which carries a body), a [`headers`](../Fetch/js-api.md#headers) / [`requestInit`](../Fetch/js-api.md#requestinit) option or a [`headers[]` ref](../Fetch/js-api.md#headers-1) makes the component fall back so those request options are not silently dropped.

The package is loaded lazily on the first request, so it never needs to be bundled when it is not used.

### Events

`ShopifyPartialsFetch` emits the same [events as `Fetch`](../Fetch/js-api.md#events), with two differences on the partial rendering path:

- the [`fetch-response` event](../Fetch/js-api.md#fetch-response) is **not** emitted, as there is no `Response` object to expose;
- the [`fetch-update` event](../Fetch/js-api.md#fetch-update) payload carries the opaque partials `update` object (as `event.detail[0].update`) instead of a parsed `Document` fragment.

On the fallback path, all events — including `fetch-response` — behave exactly like the base [`Fetch`](../Fetch/js-api.md#events) component.
