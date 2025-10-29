---
badges: [JS, Twig]
---

# FigureVideoTwicpics <Badges :texts="$frontmatter.badges" />

Use the `FigureVideoTwicpics` component to display loop, muted & autoplay decorative videos with the Twicpics API.

## Table of content

- [Examples](./examples.md)
- [JS API](./js-api.md)
- [Twig API](./twig-api.md)

## Usage

Register the component in your JavaScript app and use the Twig template to display videos.

```js {2,8}
import { Base, createApp } from '@studiometa/js-toolkit';
import { FigureVideoTwicpics } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'Base',
    components: {
      FigureVideo: FigureVideoTwicpics,
    }
  };
}

export default createApp(App);
```
```twig
{% include '@ui/FigureVideo/FigureVideoTwicpics.twig' with {
  src: '/video.mp4',
  width: 640,
  height: 360,
  twic_domain: ''
} only %}
```

### Configuring the domain and path in JavaScript

To avoid repeating the domain and path of your Twicpics project via `data-option-*` attributes, you can define the `domain` and `path` getter directly by extending the `FigureVideoTwicpics` class in your project.

```js
import { FigureVideoTwicpics } from '@studiometa/ui';

export default class FigureVideo extends FigureVideoTwicpics {
  static config = {
    ...FigureVideoTwicpics.config,
    name: 'FigureVideo',
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
- import { FigureVideoTwicpics } from '@studiometa/ui';
+ import { FigureVideo } from './Figure.js';

  class App extends Base {
    static config = {
      name: 'Base',
      components: {
-       FigureVideo: FigureVideoTwicpics,
+       FigureVideo,
      }
    };
  }

  export default createApp(App);
```

::: warning
Setting the domain and path via getters in JavaScript will work with lazyloaded images. If you disable lazyloading when using the Twig template, you will need to specify the `twic_domain` and `twic_path` Twig options.
:::
