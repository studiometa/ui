---
badges: [JS, Twig]
---

# FigureVideo <Badges :texts="$frontmatter.badges" />

Use the `FigureVideo` component to display loop, muted & autoplay decorative videos.

## Table of content

- [Examples](./examples.md)
- [JS API](./js-api.md)
- [Twig API](./twig-api.md)

## Usage

Register the component in your JavaScript app and use the Twig template to display videos.

```js {2,8}
import { Base, createApp } from '@studiometa/js-toolkit';
import { FigureVideo } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'Base',
    components: {
      FigureVideo,
    }
  };
}

export default createApp(App);
```
```twig
{% include '@ui/FigureVideo/FigureVideo.twig' with {
  src: '/video.mp4',
  width: 640,
  height: 360
} only %}
```

### With or without lazy load

The Twig component is lazy by default, so if you need to display videos with an eager loading strategy, set the `lazy` parameter to `false`;

```diff
{% include '@ui/FigureVideo/FigureVideo.twig' with {
  src: '/video.mp4',
  width: 640,
  height: 360,
+ lazy: false
} only %}
```

### With TwicPics

If your project uses TwicPics to optimize videos, you can use the `FigureVideoTwicpics` class instead of the `Figure` class. You will need to extend it in your project to configure the TwicPics' domain to use.

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
}
```

And replace the import in your app to import your local class instead of the one from the package.

```diff
  import { Base, createApp } from '@studiometa/js-toolkit';
- import { FigureVideo } from '@studiometa/ui';
+ import { FigureVideo } from './FigureVideo.js';

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
