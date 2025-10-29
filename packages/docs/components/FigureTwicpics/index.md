---
badges: [JS, Twig]
---

# FigureTwicpics <Badges :texts="$frontmatter.badges" />

Use the `FigureTwicpics` component to display images with the Twicpics API.

## Table of content

- [Examples](./examples.md)
- [JS API](./js-api.md)
- [Twig API](./twig-api.md)

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
  {% include '@ui/Figure/FigureTwicpics.twig' with {
    src: 'https://picsum.photos/400/400',
    width: 400,
    height: 400,
    twic_domain: ''
  } only %}
</div>
```

### With JavaScript only

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

::: warning
Setting the domain and path via getters in JavaScript will work with lazyloaded images. If you disable lazyloading when using the Twig template, you will need to specify the `twic_domain` and `twic_path` Twig options.
:::

### With Twig

If your project uses Twig as a templating language, it is recommended to define the domain and path for TwicPics in Twig. This will allow the usage of TwicPics for placeholders.

The best way to implement this is to define an override for the `Figure.twig` template in your project by adding an `atoms/Figure/Figure.twig` file and using the `@ui` namespace to include the component `{% include '@ui/Figure/Figure.twig' with {} %}`. You will then be able to extends the `FigureTwicpics.twig` template:

```twig
{% extends '@ui-pkg/Figure/FigureTwicpics.twig' %}

{% set twic_domain = 'my-domain.twic.pics' %}
{% set twic_path = 'my-path' %}
```

::: info
This approach is a replacement of defining the domain and path in JavaScript described above.
:::

### Using placeholders

By default, the `FigureTwicpics` component uses an blank SVG placeholder as the source of the image. This can be customized with the [`twic_placeholder` parameter](/components/FigureTwicpics/twig-api.md#twic-placeholder).

```twig {4,10-12}
{# Will display a blurred version of the image #}
{% include '@ui/Figure/FigureTwicpics.twig' with {
  twic_domain: 'org.twic.pics',
  twic_placeholder: 'preview',
} %}

{# Will display a lighter version of the image with its quality degraded to 5 #}
{% include '@ui/Figure/FigureTwicpics.twig' with {
  twic_domain: 'org.twic.pics',
  twic_placeholder: {
    quality_max: 5,
  },
} %}
```
