---
badges: [JS, Twig]
---

# Cursor <Badges :texts="$frontmatter.badges" />

Use the cursor component to easily add a custom cursor to your project.

## Table of content

- [Examples](./examples.md)
- [JS API](./js-api.md)
- [Twig API](./twig-api.md)

## Usage

Once the [package installed](/guide/installation/), simply include the template in your project:

```js {2,8}
import { Base, createApp } from '@studiometa/js-toolkit';
import { Cursor } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'Base',
    components: {
      Cursor,
    }
  };
}

export default createApp(App);
```
```twig
{% include '@ui/Cursor/Cursor.twig' only %}
```
