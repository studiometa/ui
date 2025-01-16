---
outline: deep
---

# ScrollReveal <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/ScrollReveal/package.json';
  const badges = [`v${pkg.version}`, 'JS'];
</script>

The `ScrollReveal` component should be used when you want to apply classes to an element when it enters the viewport.

## Table of content

- [Examples](./examples)
- [JS API](./js-api)

## Usage

Using this component is quite straightforward as it can directly be used in an application. It is based on the [`Transition` primitive](/components/Transition/) to manage its transition states under the hood.

```js
import { Base, createApp } from '@studiometa/js-toolkit';
import { ScrollReveal } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      ScrollReveal,
    },
  };
}

export default createApp(App);
```

```html
<div
  data-component="ScrollReveal"
  data-option-enter-from="opacity-0"
  data-option-enter-active="transition"
>
  <div data-ref="target" class="opacity-0">...</div>
</div>
```

### Configuring an offset for the reveal

The `ScrollReveal` component uses the [`withMountWhenInView` decorator] to detect when the root element is entering the viewport. You can configure an offset by using the `data-option-intersection-observer` option from the decorator to adjust the `rootMargin` property.

#### Via the `data-option` attribute in HTML

```twig {4}
<div data-component="ScrollReveal"
  data-option-enter-from="opacity-0"
  data-option-enter-active="transition"
  data-option-intersection-observer="{{ { rootMargin: '100px' }|json_encode }}">
  <div data-ref="target" class="opacity-0">
    ...
  </div>
</div>
```

#### By overring the default value of the `intersectionObserver` option in JavaScript

```js {8-11}
import { ScrollReveal as ScrollRevealCore } from '@studiometa/ui';

export default class ScrollReveal extends ScrollRevealCore {
  static config = {
    ...ScrollRevealCore.config,
    options: {
      ...ScrollRevealCore.config.options,
      intersectionObserver: {
        type: Object,
        default: () => ({ rootMargin: '100px' }),
      },
    },
  };
}
```
