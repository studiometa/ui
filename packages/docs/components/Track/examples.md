---
title: Track examples
---

# Examples

## Shopify product page

A product page that sets shared context once, tracks a product impression, and publishes an `add_to_cart` event through `TrackShopify` — the button only declares the event name, everything else is inherited from the context.

```liquid
<section data-component="TrackContext">
  <script data-ref="context" type="application/json">
    {
      "page_type": "product",
      "currency": {{ cart.currency.iso_code | json }},
      "item": {
        "item_id": {{ product.id | json }},
        "item_name": {{ product.title | json }},
        "price": {{ product.price | divided_by: 100.0 | json }}
      }
    }
  </script>

  <article
    data-component="TrackShopify"
    data-track:view.once='{"event": "my_app:view_item"}'>

    <h1>{{ product.title }}</h1>

    <button
      data-component="TrackShopify"
      data-track:click='{"event": "my_app:add_to_cart"}'>
      Add to cart
    </button>
  </article>
</section>
```

The `add_to_cart` click publishes:

```js
Shopify.analytics.publish('my_app:add_to_cart', {
  page_type: 'product',
  currency: 'EUR',
  item: { item_id: 123, item_name: 'Cotton Tee', price: 29.9 },
  event: 'my_app:add_to_cart',
});
```

::: tip
Author rich payloads in a `<script type="application/json">` rather than an attribute: the content is element text, so Liquid's `| json` filter output containing quotes or apostrophes (`L'Oréal`, `Men's`) stays valid. If a value can contain the literal `</script>`, guard it with a `replace` filter — `| json | replace: '</', '<\/'`.
:::

## GA4 item list (dataLayer)

Track a collection impression with a GA4 `ecommerce.items` array. Arrays replace on merge, so an event's list fully overrides one coming from the context.

```liquid
<div
  data-component="Track"
  data-track:view.once>
  <script data-ref="payload" type="application/json">
    {
      "event": "view_item_list",
      "ecommerce": {
        "item_list_id": {{ collection.handle | json }},
        "items": [
          {%- for product in collection.products -%}
          {
            "item_id": {{ product.id | json }},
            "item_name": {{ product.title | json }},
            "index": {{ forloop.index0 }}
          }{%- unless forloop.last -%},{%- endunless -%}
          {%- endfor -%}
        ]
      }
    }
  </script>
</div>
```

## Switching provider

The same markup targets a different destination by changing the component name — no JavaScript change:

```html
<!-- GTM / dataLayer -->
<button data-component="Track" data-track:click='{"event": "add_to_cart"}'>Add to cart</button>

<!-- Shopify -->
<button data-component="TrackShopify" data-track:click='{"event": "my_app:add_to_cart"}'>
  Add to cart
</button>
```
