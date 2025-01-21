---
badges: [JS, Twig]
---

# Figure <Badges :texts="$frontmatter.badges" />

Use the `Figure` component to display images.

## Table of content

- [Examples](./examples.html)
- [JS API](./js-api.html)
- [Twig API](./twig-api.html)

## Usage

Register the component in your JavaScript app and use the Twig template to display images.

```js {2,8}
import { Base, createApp } from '@studiometa/js-toolkit';
import { Figure } from '@studiometa/ui';

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
```twig
<div class="card">
  {% include '@ui/Figure/Figure.twig' with {
    src: 'https://picsum.photos/400/400',
    width: 400,
    height: 400,
  } only %}
</div>
```

### With or without lazy load

The Twig component is lazy by default, so if you need to display images with an eager loading strategy, set the `lazy` parameter to `false`;

```diff
  <div class="card">
    {% include '@ui/Figure/Figure.twig' with {
      src: 'https://picsum.photos/400/400',
      width: 400,
      height: 400,
+     lazy: false
    } only %}
  </div>
```

### With TwicPics

If your project uses TwicPics to optimize images, you can use the `FigureTwicpics` class instead of the `Figure` class. You will need to extend it in your project to configure the TwicPics' domain to use.

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
}
```

And replace the import in your app to import your local class instead of the one from the package.

```diff
  import { Base, createApp } from '@studiometa/js-toolkit';
- import { Figure } from '@studiometa/ui';
+ import { Figure } from './Figure.js';

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
