---
badges: [JS]
---

# Indexable <Badges :texts="$frontmatter.badges" />

The Indexable primitive provides index management for components that need to navigate between multiple items. It offers methods to move between indices (`goNext()`, `goPrev()`, `goTo()`), supports different boundary behaviors (clamp, loop, bounce), and emits events when the index changes. It suits building components like sliders, carousels, tabs, or any component that needs to track and navigate through a collection of items.

It is available as an `Indexable` component as well as a `withIndex(Base)` decorator.

## Usage

### Standalone

For simple cases, the `Indexable` component can be used directly in your HTML by setting the number of items with the [`total`](./js-api#total) option. Its index can then be driven from other components such as [`Action`](../Action/):

```html
<div data-component="Indexable" data-option-total="3" data-option-boundary="loop">
  <button type="button" data-component="Action" data-option-target="Indexable" data-option-effect="target.goPrev()">Previous</button>
  <button type="button" data-component="Action" data-option-target="Indexable" data-option-effect="target.goNext()">Next</button>
</div>
```

### As a base class

As a primitive, the `Indexable` class can also be used to create other components. The `length` property defaults to the `total` option (`0` when unset) and can be overridden to derive the number of items from the component's content instead.

```js
import { Indexable } from '@studiometa/ui';

export default class Counter extends Indexable {
  static config = {
    name: 'Counter',
  };

  get length() {
    return 10;
  }

  onIndex() {
    this.$el.textContent = this.currentIndex;
  }
}
```

Once your component is created, you can use it in your app and trigger its `goNext` and `goPrev` methods to update its states:

```js {2,10,13-15,17-19}
import { Base, createApp } from '@studiometa/js-toolkit';
import Counter from './Counter.js';

class App extends Base {
  static config = {
    name: 'App',
    refs: ['prevBtn', 'nextBtn'],
    components: {
      Counter,
    },
  };

  onPrevBtnClick() {
    this.$children.Counter.forEach((instance) => instance.goPrev());
  }

  onNextBtnClick() {
    this.$children.Counter.forEach((instance) => instance.goNext());
  }
}

export default createApp(App);
```

You can now add a counter component in your HTML and define the boundary behavior:

```html
<output data-component="Counter" data-option-boundary="loop">0</output>
<button type="button" data-ref="prevBtn">Previous</button>
<button type="button" data-ref="nextBtn">Next</button>
```

::: tip Example
Checkout the [result of this example](./examples#counter) for a better understanding.
:::
