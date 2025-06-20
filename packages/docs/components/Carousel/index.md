---
badges: [JS]
---

# Carousel <Badges :texts="$frontmatter.badges" />

## Table of content

- [Examples](./examples.md)

## Usage

Use the `Carousel` component to display a carousel with native scroll capabilities.

::: code-group

```js twoslash [app.js]
import { Base, createApp } from '@studiometa/js-toolkit';
import { Carousel } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Carousel,
    },
  };
}

export default createApp(App);
```

```twig [carousel.twig]
<div data-component="Carousel">
  <div data-component="CarouselWrapper CarouselDrag" class="whitespace-nowrap">
    {% for item in 1..4 %}
      <div data-component="CarouselItem" class="inline-block">
        #{{ item }}
      </div>
    {% endfor %}
  </div>
</div>
```

:::
