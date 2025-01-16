# AnchorScrollTo (todo) <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/AnchorScrollTo/package.json';

  const badges = [`v${pkg.version}`, 'JS'];
</script>

The `AnchorScrollTo` atom is a small interface to the [`scrollTo` utility function](https://js-toolkit.studiometa.dev/utils/scrollTo.html) from the [@studiometa/js-toolkit package](https://js-toolkit.studiometa.dev).

::: warning
It should be used on `<a>` elements only.
:::

## Table of content

- [Examples](./examples)
- [JS API](./js-api)

## Usage

This component can be directly imported and defined as a dependency of your application and set up to be instanciated on elements matching the `a[href^="#"]` selector:

```js {2,8}
import { Base, createApp } from '@studiometa/js-toolkit';
import { AnchorScrollTo } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      'a[href^="#"]': AnchorScrollTo
    },
  };
}
```
