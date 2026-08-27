---
badges: [JS, Twig]
---

# FigureVideoTwicpics <Badges :texts="$frontmatter.badges" />

Use the `FigureVideoTwicpics` component to display loop, muted & autoplay decorative videos with the Twicpics API.

## Usage

Register the component in your JavaScript app and use the Twig template to display videos.

The Twig template writes `data-component="FigureVideo"`, and a component mounts on its configured name, so declare that name on a subclass:

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { FigureVideoTwicpics } from '@studiometa/ui';

class FigureVideo extends FigureVideoTwicpics {
  static config = {
    name: 'FigureVideo',
  };
}

registerComponent(FigureVideo);
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
  import { registerComponent } from '@studiometa/js-toolkit';
- import { FigureVideoTwicpics } from '@studiometa/ui';
+ import { FigureVideo } from './FigureVideo.js';

- registerComponent(FigureVideoTwicpics);
+ registerComponent(FigureVideo);
```

The local class must declare `name: 'FigureVideo'`, because a component mounts on its configured name and the Twig template writes `data-component="FigureVideo"`.

::: warning
Setting the domain and path via getters in JavaScript will work with lazyloaded images. If you disable lazyloading when using the Twig template, you will need to specify the `twic_domain` and `twic_path` Twig options.
:::
