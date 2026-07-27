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
  data-option-sections="main-collection-product-grid,collection-results-count"
  data-option-history>
  Sort by price
</a>

{% comment %} `{% section %}` already outputs the `shopify-section-*` wrapper matched by id. {% endcomment %}
{% section 'main-collection-product-grid' %}
{% section 'collection-results-count' %}
```

```ts [app.ts]
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
  data-option-sections="main-collection-product-grid"
  data-on:change="$el.requestSubmit()"
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
  data-option-enter-active="transition"
  data-option-leave-to="opacity-0"
  data-option-leave-active="transition"
  data-option-leave-keep
  class="transition opacity-0">
  Loading…
</div>

{% comment %} `{% section %}` already outputs the `shopify-section-*` wrapper matched by id. {% endcomment %}
{% section 'main-collection-product-grid' %}
```

```ts [app.ts]
import { registerComponent } from '@studiometa/js-toolkit';
import { Action, FetchShopifySection, Transition } from '@studiometa/ui';

registerComponent(Action);
registerComponent(FetchShopifySection);
registerComponent(Transition);
```

:::

::: tip
Changing a facet fires a native `change` event that bubbles to the form, where the [`Action`](../Action/index.md) binding calls `requestSubmit()` to trigger the request — no submit button needed once JavaScript runs. Keep the `<noscript>` submit button — together with a section-free `action` — so filtering still works without JavaScript.
:::
