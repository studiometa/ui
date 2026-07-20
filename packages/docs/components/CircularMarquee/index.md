---
badges: [JS, Twig]
---

# CircularMarquee <Badges :texts="$frontmatter.badges" />

Use this component to create CircularMarquee, a spinning on scroll circular text. This is made using the `<svg>` capabilities.

## Usage

After you install the [package](/guide/installation/), include the Twig template and load the JavaScript component in your project:

```twig
{% include '@ui-pkg/CircularMarquee/CircularMarquee.twig' with {
  id: 'unique-id',
  radius: 120,
  outer_radius: 150,
  content: ' My text content'
} only %}
```

```js
import { Base, createApp } from '@studiometa/js-toolkit';
import { CircularMarquee } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      CircularMarquee,
    },
  };
}

export default createApp(App);
```
