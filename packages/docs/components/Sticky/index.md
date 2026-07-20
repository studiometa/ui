---
badges: [JS, Twig]
---

# Sticky <Badges :texts="$frontmatter.badges" />

Use the `Sticky` component to keep an element fixed in place while its container
scrolls, and to react when the element enters or leaves its sticky state.

## Usage

Register the JavaScript component in your app and include the Twig template:

```js
import { Base, createApp } from '@studiometa/js-toolkit';
import { Sticky } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Sticky,
    },
  };
}

export default createApp(App, document.body);
```

```twig
{% include '@ui/Sticky/Sticky.twig' with { content: 'Sticky content' } only %}
```
