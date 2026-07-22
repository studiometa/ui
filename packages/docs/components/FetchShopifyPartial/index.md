---
badges: [JS]
---

# FetchShopifyPartial <Badges :texts="$frontmatter.badges" />

The `FetchShopifyPartial` component extends the [`Fetch` component](../Fetch/index.md) to refresh a page with Shopify's [partial rendering](https://shopify.dev/docs/storefronts/themes/getting-started/developer-preview/partial) API (Liquid July&nbsp;'26 developer preview). Server-rendered regions marked with the `{% partial %}` tag are updated in place — preserving focus, text selection, form values and scroll position, with support for the View Transition API — without a full page reload.

::: warning Developer preview
Shopify partial rendering relies on the [`@shopify/partial-rendering`](https://www.npmjs.com/package/@shopify/partial-rendering) package, which is part of the Liquid July&nbsp;'26 developer preview. It is declared as an **optional** dependency: when it is not installed — or when no partial is configured — the component transparently falls back to the base [`Fetch`](../Fetch/index.md) behaviour (id-based full-page swap).
:::

## Installation

Install the optional Shopify package alongside `@studiometa/ui`:

```bash
npm install @shopify/partial-rendering
```

## Usage

Register the component in your JavaScript app:

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { FetchShopifyPartial } from '@studiometa/ui';

registerComponent(FetchShopifyPartial);
```

Wrap the server-rendered region to refresh with the `{% partial %}` tag in your Liquid template:

```liquid
{% partial 'product-grid' %}
  {% for product in collection.products %}
    {% render 'product-card', product: product %}
  {% endfor %}
{% endpartial %}
```

Then trigger a refresh from a link or a form, listing the partials to update with the [`partials` option](./js-api.md#partials):

```html
<a
  href="{{ collection.url }}?sort_by=price-ascending"
  data-component="FetchShopifyPartial"
  data-option-partials='["product-grid", "product-count"]'>
  Sort by price
</a>
```

Clicking the link fetches fresh HTML for the `product-grid` and `product-count` partials and swaps them in place. Because `FetchShopifyPartial` extends `Fetch`, it inherits every [option](./js-api.md), getter, method and event of the base component, including the loader, [`history`](../Fetch/js-api.md#history) and [`viewTransition`](../Fetch/js-api.md#viewtransition) features.

## Choosing between the partials and Section Rendering APIs

If you are not using the Liquid July&nbsp;'26 partial rendering preview, the base [`Fetch`](../Fetch/index.md) component can already consume Shopify's stable [Section Rendering API](../Fetch/examples.md#shopify-section-rendering-api) with no extra package. Reach for `FetchShopifyPartial` when you want the ergonomics and state preservation of the newer `{% partial %}` primitive.
