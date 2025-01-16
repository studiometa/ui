# Transition <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/Transition/package.json';

  const badges = [`v${pkg.version}`, 'JS'];
</script>

The Transition primitive should be used when creating components which can switch between two states (often visible/hidden). It implements the [`transition` utility](https://js-toolkit.studiometa.dev/utils/css/transition.html) from the [@studiometa/js-toolkit package](https://js-toolkit.studiometa.dev) and provides configuration via `data-option-...` attributes and actions with the `leave` and `leave` methods which trigger the transition between the two states of the component.

## Table of content

- [Examples](./examples)
- [JS API](./js-api)

## Usage

As a primitive, the `Transition` class should be used to create other components instead of being used directly in an application.

```js
import { Transition } from '@studiometa/ui';

export default class Togglable extends Transition {
  static config = {
    name: 'Togglable',
  };
}
```

Once you component is created, you can use it in your app and trigger its `enter` and `leave` methods to switch its states:

```js {2,10,13-15,17-19}
import { Base, createApp } from '@studiometa/js-toolkit';
import Togglable from './Togglable.js';

class App extends Base {
  static config = {
    name: 'App',
    refs: ['enterBtn', 'leaveBtn'],
    components: {
      Togglable,
    },
  };

  onEnterBtnClick() {
    this.$children.Togglable[0].enter();
  }

  onLeaveBtnClick() {
    this.$children.Togglable[0].leave();
  }
}

export default createApp(App);
```

You can now add a togglable component in your HTML with the needed option to describe the transition:

```html
<div
  data-component="Togglable"
  data-option-enter-from="transform translate-y-20 opacity-0"
  data-option-enter-active="transition duration-500 ease-out-expo"
  data-option-leave-active="transition duration-500 ease-out-expo"
  data-option-leave-to="transform translate-y-20 opacity-0"
  data-option-leave-keep
  class="transform translate-y-4 opacity-0"
>
  ...
</div>
```

::: tip Example
Checkout the [result of this example](./examples#togglable) for a better understanding.
:::
