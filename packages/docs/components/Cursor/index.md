---
badges: [JS, Twig]
---

# Cursor <Badges :texts="$frontmatter.badges" />

Use the cursor component to add a custom cursor to your project.

## Usage

After you install the [package](/guide/installation/), include the template in your project:

```js {2,8}
import { Base, createApp } from '@studiometa/js-toolkit';
import { Cursor } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Cursor,
    },
  };
}

export default createApp(App);
```

```twig
{% include '@ui/Cursor/Cursor.twig' only %}
```
