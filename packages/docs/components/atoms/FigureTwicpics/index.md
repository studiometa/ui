---
outline: deep
---

# FigureTwicpics <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/atoms/Figure/package.json';
  const badges = [`v${pkg.version}`, 'Twig', 'JS'];
</script>

Use the `FigureTwicpics` component to display images with the Twicpics API.

## Table of content

- [Examples](./examples.html)
- [JS API](./js-api.html)
- [Twig API](./twig-api.html)

## Usage

Register the component in your JavaScript app and use the Twig template to display images.

```js {2,8}
import { Base, createApp } from '@studiometa/js-toolkit';
import { FigureTwicpics } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'Base',
    components: {
      Figure: FigureTwicpics,
    }
  };
}

export default createApp(App);
```
```twig
<div class="card">
  {% include '@ui/atoms/Figure/FigureTwicpics.twig' with {
    src: 'https://picsum.photos/400/400',
    width: 400,
    height: 400,
    twic_domain: ''
  } only %}
</div>
```

### Configuring the domain and path in JavaScript

To avoid repeating the domain and path of your Twicpics project via `data-option-*` attributes, you can define the `domain` and `path` getter directly by extending the `FigureTwicpics` class in your project.

```js
import { FigureTwicpics } from '@studiometa/ui';

export default class Figure extends FigureTwicpics {
  static config = {
    ...FigureTwicpics.config,
    name: 'Figure',
  };

  get domain() {
    return 'domain.twic.pics';
  }

  get path() {
    return 'production';
  }
}
```

And replace the import in your app to import your local class instead of the one from the package.

```diff
  import { Base, createApp } from '@studiometa/js-toolkit';
- import { FigureTwicpics } from '@studiometa/ui';
+ import { Figure } from './atoms/Figure.js';

  class App extends Base {
    static config = {
      name: 'Base',
      components: {
        Figure,
      }
    };
  }

  export default createApp(App);
```

::: warning
Setting the domain and path via getters in JavaScript will work with lazyloaded images. If you disable lazyloading when using the Twig template, you will need to specify the `twic_domain` and `twic_path` Twig options.
:::
