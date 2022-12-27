# Cursor <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/atoms/Cursor/package.json';
  const badges = [`v${pkg.version}`, 'Twig', 'JS'];
</script>

Use the cursor component to easily add a custom cursor to your project.

## Table of content

- [Examples](./examples.html)
- [JS API](./js-api.html)
- [Twig API](./twig-api.html)

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
{% include '@ui/atoms/Cursor/Cursor.twig' only %}
```
