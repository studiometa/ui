---
title: FetchShopifySection examples
---

# Examples

::: tip
These examples run against a Shopify storefront using the [Section Rendering API](https://shopify.dev/docs/api/ajax/section-rendering), so they are shown as code rather than live playgrounds. See the [`Fetch` examples](../Fetch/examples.md) for runnable demonstrations of the inherited behaviour.
:::

## Sorting a collection

Refresh the product grid and the results count when the customer picks a sort order. The `href` keeps the section IDs out of it, so it stays a working link without JavaScript.

::: code-group

```liquid [collection.liquid]
<a
  href="{{ collection.url }}?sort_by=price-ascending"
  data-component="FetchShopifySection"
  data-option-sections='["main-collection-product-grid", "collection-results-count"]'
  data-option-history>
  Sort by price
</a>

<div id="shopify-section-main-collection-product-grid">
  {% section 'main-collection-product-grid' %}
</div>
<div id="shopify-section-collection-results-count">
  {% section 'collection-results-count' %}
</div>
```

```js [app.ts]
import { registerComponent } from '@studiometa/js-toolkit';
import { FetchShopifySection } from '@studiometa/ui';

registerComponent(FetchShopifySection);
```

:::

## Faceted filtering with a form

Use a `<form method="get">` so the selected facets are appended to the URL automatically; `FetchShopifySection` adds the `sections` parameter on top. A loader is shown while the sections refresh, using the inherited [`Action`](../Action/index.md) and [`Transition`](../Transition/index.md) components.

::: code-group

```liquid [collection.liquid]
<form
  action="{{ collection.url }}"
  method="get"
  data-component="FetchShopifySection Action"
  data-option-sections='["main-collection-product-grid"]'
  data-on:fetch-before="Transition(#filters-loader) -> target.enter()"
  data-on:fetch-after="Transition(#filters-loader) -> target.leave()">
  {% for filter in collection.filters %}
    {% render 'facet', filter: filter %}
  {% endfor %}
  <noscript><button type="submit">Apply</button></noscript>
</form>

<div
  id="filters-loader"
  data-component="Transition"
  data-option-enter-from="opacity-0"
  data-option-leave-to="opacity-0"
  data-option-leave-keep
  class="opacity-0">
  Loading…
</div>

<div id="shopify-section-main-collection-product-grid">
  {% section 'main-collection-product-grid' %}
</div>
```

```js [app.ts]
import { registerComponent } from '@studiometa/js-toolkit';
import { Action, FetchShopifySection, Transition } from '@studiometa/ui';

registerComponent(Action);
registerComponent(FetchShopifySection);
registerComponent(Transition);
```

:::

::: tip
Submitting a facet triggers the request automatically once the form is enhanced. Keep a `<noscript>` submit button — together with a section-free `action` — so filtering still works without JavaScript.
:::
