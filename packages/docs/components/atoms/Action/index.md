# Action <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/atoms/Action/package.json';

  const badges = [`v${pkg.version}`, 'JS'];
</script>

The `Action` atom is a component who trigger an action on specified components.

## Table of content

- [Examples](./examples)
- [JS API](./js-api)

## Usage

This component can be directly imported and defined as a dependency of your application:

```js {2,8}
import { Base, createApp } from '@studiometa/js-toolkit';
import { Action } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Action,
    },
  };
}
```

```html
<button
  type="button"
  data-component="Action"
  data-option-target="Panel Modal"
  data-option-selector=".can-be-closed"
  data-option-method="close">
  Close every panel & modal with .can-be-closed class
</button>
```
