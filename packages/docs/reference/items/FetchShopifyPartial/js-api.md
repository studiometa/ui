---
title: FetchShopifyPartial JS API
outline: deep
---

# JS API

The `FetchShopifyPartial` class extends the [`Fetch` class](../Fetch/js-api.md) and delegates loading and DOM updates to Shopify's [`@shopify/partial-rendering`](https://www.npmjs.com/package/@shopify/partial-rendering) package when partials are configured. All [`Fetch` options](../Fetch/js-api.md#options), getters, methods and events are inherited, with the same lifecycle. The additions and differences are documented below.

## Options

### `partials`

- Type: `string`
- Default: `''`

The names of the Shopify partials to refresh, matching the names used in the corresponding `{% partial %}` tags. Provide them as a comma-separated list in the `data-option-partials` attribute; surrounding whitespace is trimmed. When empty, the component falls back to the base [`Fetch`](../Fetch/index.md) behaviour.

```html
<a
  href="/collections/all"
  data-component="FetchShopifyPartial"
  data-option-partials="product-grid,product-count">
  Refresh
</a>
```

## Static properties

### `PARTIALS_MODULE`

- Type: `string`
- Default: `'@shopify/partial-rendering'`

The module specifier of the partial rendering package. Override it in a subclass to load the package from another place.

### `loadPartialsModule()`

- Returns: `Promise<{ partials }>`

Imports the module named by `PARTIALS_MODULE`. Override it in a subclass, or assign it, to give a fake module in a test.

## Methods

### `resolvePartials()`

- Returns: `Promise<PartialsApi | null>`

Loads the partials API once per instance and keeps the result. It resolves with `null` when the package or its `partials` export is missing, and it never rejects.

## Behaviour

`FetchShopifyPartial` changes two steps of the inherited lifecycle and nothing else. See [extending Fetch](../Fetch/js-api.md#extending-fetch).

- `__load()` asks `partials.fetch(...names, { url, signal })` for the update of the request URL.
- `__apply()` gives the update to `partials.apply()`, which swaps the DOM, runs its own view transition and keeps focus, text selection, form values and scroll position. `Fetch` does not claim a view transition around it.

Every other rule comes from `Fetch`: the request and `fetch-before`, the checks against newer requests, history, the events and the outcome of [`fetch()`](../Fetch/js-api.md#fetch-destination-string-url). The `partials` option is kept in the recipe of a history entry, so back and forward navigation load through partials too, also when the element has left the page.

### Fallback to Fetch

The partials path is used only when the [`partials` option](#partials) lists at least one name **and** the `@shopify/partial-rendering` package loads. In every other case, the component loads and applies the content like the base [`Fetch`](../Fetch/index.md) component, and swaps content by matching `id` attributes from a full response. It falls back to `Fetch` when:

- no partial is configured, or the package is not installed;
- the request is not a plain GET. The partials API only loads a URL, so the component falls back when a request carries a body, another method or a header that the component does not send on its own behalf, and when the [`requestInit` option](../Fetch/js-api.md#requestinit) holds a key other than `headers`. This covers the [`headers`](../Fetch/js-api.md#headers) option, the [`headers[]` refs](../Fetch/js-api.md#headers-1), a `method="post"` form and a header added in [`fetch-before`](../Fetch/js-api.md#fetch-before). The rule is checked on the final request, after `fetch-before`. The headers that the component names in `HEADER_NAMES`, such as `user-agent` and `x-triggered-by`, are ignored, so clicks, submissions and back and forward navigation still use partials.

The package is loaded lazily on the first request, so it never needs to be bundled when it is not used.

### Events

`FetchShopifyPartial` emits the same [events as `Fetch`](../Fetch/js-api.md#events), in the same order. On the partials path:

- [`fetch-response`](../Fetch/js-api.md#fetch-response) is **not** emitted, because there is no `Response`;
- the opaque partials update is the `content` of [`fetch-update-before`](../Fetch/js-api.md#fetch-update-before), and `response` is `undefined`;
- [`fetch-update-after`](../Fetch/js-api.md#fetch-update-after) carries no `response` and no `fragment`;
- a rejected `partials.fetch()` or `partials.apply()` gives `fetch-error`, then `fetch-after` with the outcome `error`.

On the fallback path, every event, `fetch-response` included, behaves exactly like the base [`Fetch`](../Fetch/js-api.md#events) component.
