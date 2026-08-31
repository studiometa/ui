---
badges: [JS]
---

# ScrollReveal <Badges :texts="$frontmatter.badges" />

The `ScrollReveal` component should be used when you want to apply classes to an element when it enters the viewport.

## Usage

This component can directly be used in an application. It is built on the [`withTransition` mixin](/reference/items/withTransition/), so it accepts the same [transition options](/reference/items/Transition/js-api) as the `Transition` primitive.

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { ScrollReveal } from '@studiometa/ui';

registerComponent(ScrollReveal);
```

```html
<div
  data-component="ScrollReveal"
  data-option-enter-from="opacity-0"
  data-option-enter-active="transition">
  <div data-ref="target" class="opacity-0">...</div>
</div>
```

### Configuring an offset for the reveal

The `ScrollReveal` component subscribes to the viewport itself rather than using a mount strategy, because its `repeat` option chooses the behavior at runtime. Configure an offset with the `intersectionObserver` option, which is passed straight to the observer, to adjust the `rootMargin` property.

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

```js {6-9}
import { ScrollReveal as ScrollRevealCore } from '@studiometa/ui';

export default class ScrollReveal extends ScrollRevealCore {
  static config = {
    name: 'ScrollReveal',
    options: {
      intersectionObserver: {
        type: Object,
        default: () => ({ rootMargin: '100px' }),
      },
    },
  };
}
```

v4 merges `config` along the prototype chain, so a subclass declares only what it changes. Keep the same `name` to replace the built-in component; give it a new one to register both, since v4 no longer renames automatically on a collision.
