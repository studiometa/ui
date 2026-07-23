---
badges: [JS]
---

# FigureShopify <Badges :texts="$frontmatter.badges" />

Use the `FigureShopify` component to display responsive images with [Shopify CDN `image_url` API](https://shopify.dev/docs/api/liquid/filters/image_url).

## Usage

Register the component in your JavaScript app and use it in your templates. The component will transform the `data-src` URL to load an image at the dimension of the `<img>` DOM element.

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { FigureShopify } from '@studiometa/ui';

registerComponent(FigureShopify, 'Figure');
```

```liquid
<div class="card">
  <figure data-component="Figure">
    <img
      data-ref="img"
      src="placeholder.png"
      data-src="{{ product | image_url }}"
      width="200"
      height="200"
      alt="">
  </figure>
</div>
```
