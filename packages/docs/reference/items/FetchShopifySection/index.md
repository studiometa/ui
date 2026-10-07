---
badges: [JS]
---

# FetchShopifySection <Badges :texts="$frontmatter.badges" />

The `FetchShopifySection` component extends the [`Fetch` component](../Fetch/index.md) to refresh parts of a page through Shopify's stable [Section Rendering API](https://shopify.dev/docs/api/ajax/section-rendering). The sections to update are declared with the [`sections` option](./js-api.md#sections) instead of being written in the URL, so the element's `href` stays a clean, working link when JavaScript is unavailable, and the section endpoint never appears in the address bar.

It needs no extra package: the Section Rendering API is available on every theme today.

## Usage

Register the component in your JavaScript app:

```js
import { registerComponents } from '@studiometa/js-toolkit';
import { FetchShopifySection } from '@studiometa/ui';

registerComponents(FetchShopifySection);
```

Trigger a refresh from a link or a form, listing the section IDs to update with the [`sections` option](./js-api.md#sections). Keep those IDs out of the `href`: the component adds them to the request itself.

```liquid
<a
  href="{{ collection.url }}?sort_by=price-ascending"
  data-component="FetchShopifySection"
  data-option-sections="main-collection-product-grid,collection-results-count">
  Sort by price
</a>

{% comment %} `{% section %}` already outputs the `shopify-section-*` wrapper matched by id. {% endcomment %}
{% section 'main-collection-product-grid' %}
{% section 'collection-results-count' %}
```

- **Without JavaScript**, the link navigates to <code v-pre>{{ collection.url }}?sort_by=price-ascending</code> — a normal, fully rendered page.
- **With JavaScript**, the component requests `…?sort_by=price-ascending&sections=main-collection-product-grid,collection-results-count`, unwraps the JSON response and swaps each `shopify-section-*` wrapper in place.

Because `FetchShopifySection` extends `Fetch`, it inherits every [option](../Fetch/js-api.md), getter, method and event of the base component, including the [`mode`](../Fetch/js-api.md#mode), [`history`](../Fetch/js-api.md#history) and [`viewTransition`](../Fetch/js-api.md#viewtransition) options and the loader pattern built on its [events](../Fetch/js-api.md#events). The `sections` option is a value of the [`params` option](../Fetch/js-api.md#params), and history records the destination, not the request URL. So `sections` never reaches the address bar, and back and forward navigation ask for the sections again. See [extending Fetch](../Fetch/js-api.md#extending-fetch) for the steps the component changes.

::: tip Forms
Use a `<form method="get">` when the parameters come from user input (facet filters, a sort `<select>`, a search field): the fields become the query of the request, and `FetchShopifySection` adds the `sections` parameter to it. No hidden `<input name="sections">` is needed. See [forms](../Fetch/index.md#forms).
:::

## Choosing between Section Rendering and partial rendering

`FetchShopifySection` uses the stable Section Rendering API and works everywhere with no extra package. If you are on the Liquid July&nbsp;'26 developer preview, [`FetchShopifyPartial`](../FetchShopifyPartial/index.md) offers the newer `{% partial %}` primitive with built-in focus, text selection, form value and scroll preservation.
