---
title: ShopifyPartialsFetch examples
---

# Examples

::: tip
These examples run against a Shopify storefront using the [Liquid July&nbsp;'26 partial rendering preview](https://shopify.dev/docs/storefronts/themes/getting-started/developer-preview/partial), so they are shown as code rather than live playgrounds. See the [`Fetch` examples](../Fetch/examples.md) for runnable demonstrations of the inherited behaviour.
:::

## Sorting a collection

Refresh the product grid and the results count when the customer picks a sort order, keeping their scroll position.

::: code-group

```liquid [collection.liquid]
{% partial 'product-grid' %}
  <ul id="product-grid" class="grid grid-cols-2 gap-4 md:grid-cols-4">
    {% for product in collection.products %}
      {% render 'product-card', product: product %}
    {% endfor %}
  </ul>
{% endpartial %}

{% partial 'product-count' %}
  <p id="product-count">{{ collection.products_count }} products</p>
{% endpartial %}

<a
  href="{{ collection.url }}?sort_by=price-ascending"
  data-component="ShopifyPartialsFetch"
  data-option-partials='["product-grid", "product-count"]'
  data-option-history>
  Sort by price
</a>
```

```js [app.ts]
import { registerComponent } from '@studiometa/js-toolkit';
import { ShopifyPartialsFetch } from '@studiometa/ui';

registerComponent(ShopifyPartialsFetch);
```

:::

## Faceted filtering with a form

Use a `<form method="get">` so the selected facets are appended to the URL automatically, and display a loader while the partials are refreshed with the inherited [`Action`](../Action/index.md) and [`Transition`](../Transition/index.md) components.

::: code-group

```liquid [collection.liquid]
<form
  action="{{ collection.url }}"
  method="get"
  data-component="ShopifyPartialsFetch Action"
  data-option-partials='["product-grid", "active-filters"]'
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

{% partial 'active-filters' %}
  <div id="active-filters">{% render 'active-filters' %}</div>
{% endpartial %}

{% partial 'product-grid' %}
  <ul id="product-grid">{% render 'product-list', products: collection.products %}</ul>
{% endpartial %}
```

```js [app.ts]
import { registerComponent } from '@studiometa/js-toolkit';
import { Action, ShopifyPartialsFetch, Transition } from '@studiometa/ui';

registerComponent(Action);
registerComponent(ShopifyPartialsFetch);
registerComponent(Transition);
```

:::

::: tip
Submitting a facet automatically triggers the request — no submit button is required when the form is enhanced. Keep a `<noscript>` submit button so filtering still works without JavaScript.
:::

## Reacting to the update event

`ShopifyPartialsFetch` inherits the [`Fetch` events](../Fetch/js-api.md#events). Use the [`fetch-update-after` event](../Fetch/js-api.md#fetch-update-after) to run logic once the regions have been swapped — for example scrolling the refreshed grid back into view after paginating. As with the base component, events bubble, so the [`Action`](../Action/index.md) handler can live on a parent element.

::: code-group

```liquid [collection.liquid]
<div
  data-component="Action"
  data-on:fetch-update-after="document.getElementById('product-grid').scrollIntoView()">
  <a
    href="{{ collection.url }}?page=2"
    data-component="ShopifyPartialsFetch"
    data-option-partials='["product-grid"]'>
    Next page
  </a>
</div>
```

```js [app.ts]
import { registerComponent } from '@studiometa/js-toolkit';
import { Action, ShopifyPartialsFetch } from '@studiometa/ui';

registerComponent(Action);
registerComponent(ShopifyPartialsFetch);
```

:::
