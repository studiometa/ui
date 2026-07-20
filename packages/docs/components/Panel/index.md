---
badges: [Twig, JS]
---

# Panel <Badges :texts="$frontmatter.badges" />

The `Panel` component extends the `Modal` component to create slide-in panels from any edge of the screen with animations.

## Usage

After you install the [package](/guide/installation/), include the template in your project:

```js{2,8}
import { Base, createApp } from '@studiometa/js-toolkit';
import { Panel } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Panel,
    },
  };
}

export default createApp(App, document.body);
```

```twig
{% include '@ui/Panel/Panel.twig' with {
  position: 'right',
  content: 'Your panel content here'
} %}
```
