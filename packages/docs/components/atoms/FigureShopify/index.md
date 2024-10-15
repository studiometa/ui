---
badges: [JS]
---

# FigureShopify <Badges :texts="$frontmatter.badges" />

Use the `FigureShopify` component to display responsive images with [Shopify CDN `image_url` API](https://shopify.dev/docs/api/liquid/filters/image_url).

## Table of content

- [Examples](./examples.html)
- [JS API](./js-api.html)

## Usage

Register the component in your JavaScript app and use it in your templates. The component will transform the `data-src` URL to load an image at the dimension of the `<img>` DOM element.

```js {2,8}
import { Base, createApp } from '@studiometa/js-toolkit';
import { FigureShopify } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'Base',
    components: {
      Figure: FigureShopify,
    }
  };
}

export default createApp(App);
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

