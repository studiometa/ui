---
title: FetchShopifySection JS API
outline: deep
---

# JS API

The `FetchShopifySection` class extends the [`Fetch` class](../Fetch/js-api.md). It changes two things: the `sections` option sets the `sections` value of the [`params` option](../Fetch/js-api.md#params), and the response is parsed as the JSON of the Section Rendering API. All [`Fetch` options](../Fetch/js-api.md#options), getters, methods and events are inherited, with the same lifecycle. See [extending Fetch](../Fetch/js-api.md#extending-fetch).

## Options

### `sections`

- Type: `string`
- Default: `''`

The IDs of the Shopify sections to refresh, matching the `sections` parameter of the [Section Rendering API](https://shopify.dev/docs/api/ajax/section-rendering) (up to five). Provide them as a comma-separated list in the `data-option-sections` attribute. Whitespace around each ID is removed.

The IDs become the `sections` value of the [`params` option](../Fetch/js-api.md#params). The request URL carries them, and the destination does not: the `href` or `action` keeps working without JavaScript, and the address bar never shows the parameter. A history entry keeps them in its recipe, so back and forward navigation ask for the sections again, also when the element has left the page.

```html
<a
  href="/collections/all"
  data-component="FetchShopifySection"
  data-option-sections="main-collection-product-grid,collection-results-count">
  Refresh
</a>
```

A value given to `sections` wins over a `sections` key of `data-option-params`. A submitter with a `formaction` keeps the sections: it drops the `params` option of the form, but not the `sections` value that this component adds.

### `response`

`FetchShopifySection` keeps the inherited default of the [`response` option](../Fetch/js-api.md#response), `response.text()`. With this default, the [`parseResponse()` method](#parseresponse-response-request-recipe) reads the JSON. Set `data-option-response` to read the response yourself: the component then evaluates your expression, like the base `Fetch`.

## Getters

### `sectionIds`

- Type: `string[]`

The configured section IDs, trimmed, without empty values.

## Methods

### `parseResponse(response, request, recipe)`

Reads the Section Rendering JSON object (`{ [id]: html }`) and joins the HTML of every section, without the sections returned as `null`. The inherited [`[id]` selector](../Fetch/js-api.md#selector) then swaps each section in place.

It reads the `params` of the recipe, not the options of the instance. A restore with no element left on the page therefore still parses JSON.

The base implementation is used instead when the request asks for no sections, or when the [`response` option](#response) is not the default.
