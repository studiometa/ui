---
badges: [JS]
---

# FetchShopifySection <Badges :texts="$frontmatter.badges" />

The `FetchShopifySection` component extends the [`Fetch` component](../Fetch/index.md) to refresh parts of a page through Shopify's stable [Section Rendering API](https://shopify.dev/docs/api/ajax/section-rendering). The sections to update are declared with the [`sections` option](./js-api.md#sections) instead of being baked into the URL, so the element's `href` stays a clean, working link when JavaScript is unavailable, and the raw section endpoint never appears in the address bar.

It needs no extra package: the Section Rendering API is available on every theme today.

## Usage

Register the component in your JavaScript app:

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { FetchShopifySection } from '@studiometa/ui';

registerComponent(FetchShopifySection);
```

Trigger a refresh from a link or a form, listing the section IDs to update with the [`sections` option](./js-api.md#sections). Keep those IDs out of the `href` — the component appends them to the request itself:

```html
<a
  href="{{ collection.url }}?sort_by=price-ascending"
  data-component="FetchShopifySection"
  data-option-sections='["main-collection-product-grid", "collection-results-count"]'>
  Sort by price
</a>

{% comment %} Wrappers rendered by Shopify, matched and swapped by id. {% endcomment %}
<div id="shopify-section-main-collection-product-grid">…</div>
<div id="shopify-section-collection-results-count">…</div>
```

- **Without JavaScript**, the link navigates to `{{ collection.url }}?sort_by=price-ascending` — a normal, fully rendered page.
- **With JavaScript**, the component requests `…?sort_by=price-ascending&sections=main-collection-product-grid,collection-results-count`, unwraps the JSON response and swaps each `shopify-section-*` wrapper in place.

Because `FetchShopifySection` extends `Fetch`, it inherits every [option](../Fetch/js-api.md), getter, method and event of the base component, including the loader, [`mode`](../Fetch/js-api.md#mode), [`history`](../Fetch/js-api.md#history) and [`viewTransition`](../Fetch/js-api.md#viewtransition) features. The `sections` parameter is stripped from the URL pushed to the history, so navigation history stays on the human-facing page.

::: tip Forms
Use a `<form method="get">` when the parameters come from user input (facet filters, a sort `<select>`, a search field): the form data is [appended to the URL automatically](../Fetch/js-api.md#url), and `FetchShopifySection` adds the `sections` parameter on top — no hidden `<input name="sections">` required.
:::

## Choosing between Section Rendering and partial rendering

`FetchShopifySection` uses the stable Section Rendering API and works everywhere with no extra package. If you are on the Liquid July&nbsp;'26 developer preview, [`FetchShopifyPartial`](../FetchShopifyPartial/index.md) offers the newer `{% partial %}` primitive with built-in focus, text selection, form value and scroll preservation.
