---
badges: [JS]
---

# Track <Badges :texts="$frontmatter.badges" />

Use the `Track` component to publish [Shopify analytics events](https://shopify.dev/docs/api/web-pixels-api/emitting-data) when a section enters the viewport or is clicked.

## Table of content

- [JS API](./js-api.md)

## Usage

Register the component in your JavaScript app and use it in your templates. The component will publish a viewed event the first time its root element enters the viewport, and a clicked event on every click, with the payload defined in the `<script data-ref="payload">` element.

```js {1,2,4}
import { registerComponent } from '@studiometa/js-toolkit';
import { Track } from '@studiometa/ui';

registerComponent(Track);
```

```liquid
<div data-component="Track">
  <script data-ref="payload" type="application/json">
    {
      "name": "bloc-name",
      "template": {{ template.name | json }}
    }
  </script>
  <a href="#">Click me</a>
</div>
```

The published events default to `bento_section_viewed` and `bento_section_clicked` and can be configured with the [`viewedEvent` and `clickedEvent` options](./js-api.md#options):

```liquid
<div
  data-component="Track"
  data-option-viewed-event="product_card_viewed"
  data-option-clicked-event="product_card_clicked">
  ...
</div>
```

::: warning Shopify only
This component relies on the `Shopify.analytics.publish` API which is only available on Shopify storefronts. A warning will be displayed in debug mode when the API is not available.
:::
