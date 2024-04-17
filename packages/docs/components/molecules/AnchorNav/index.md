# AnchorNav <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/molecules/AnchorNav/package.json';
  const badges = [`v${pkg.version}`, 'Twig'];
</script>

## Table of content

- [Examples](./examples)
- [JS API](./js-api)

## Usage

This component can be directly imported and defined as a dependency of your application:

```js{2,8}
import { Base, createApp } from '@studiometa/js-toolkit';
import { AnchorNav } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      AnchorNav,
    },
  };
}

export default createApp(App, document.body);
```

Then in your html make sure to have similar id and href for the link and the target.

```html{16}
<div data-component="AnchorNav">
  <a href="#item-1" data-component="AnchorNavLink"></a>
  <div id="item-1" data-component="AnchorNavTarget"></div>
</div>
```

You can then add options from the [withTransition](/components/primitives/Transition/#transition) and [withMountWhenInView](https://js-toolkit.studiometa.dev/api/decorators/withMountWhenInView.html):

```html{16}
<div data-component="AnchorNav">
  <a href="#item-1" data-component="AnchorNavLink"
    data-option-enter-to="bg-pink-200"
    data-option-enter-active="transition-all duration-500 ease-out-expo"
    data-option-enter-keep></a>
  <div id="item-1"
    data-component="AnchorNavTarget"
    data-option-intersection-observer='{
      "threshold": 0.5,
      "rootMargin": "0% 0px -30% 0px"
    }'>
  </div>
</div>
```
