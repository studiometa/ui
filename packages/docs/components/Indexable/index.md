---
badges: [JS]
---

# Indexable <Badges :texts="$frontmatter.badges" />

The Indexable primitive provides a robust index management system for components that need to navigate between multiple items. It offers methods to move between indices (`goNext()`, `goPrev()`, `goTo()`), supports different navigation modes (normal, infinite loop, alternate), and emits events when the index changes. It's ideal for building components like sliders, carousels, tabs, or any component that needs to track and navigate through a collection of items.

It is available as a `Indexable` component as well as a `withIndex(Base)` decorator.

## Table of content

- [Examples](./examples)
- [JS API](./js-api)

## Usage

As a primitive, the `Indexable` class should be used to create other components rather than being used directly in an application. **Important:** the `length` property must be defined.

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

Once you component is created, you can use it in your app and trigger its `goNext` and `goPrev` methods to update its states:

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

You can now add a counter component in your HTML and define the count mode:

```html
<output data-component="Counter" data-option-mode="infinite">
  0
</output>
<button type="button" data-ref="prevBtn">Previous</button>
<button type="button" data-ref="nextBtn">Next</button>
```

::: tip Example
Checkout the [result of this example](./examples#counter) for a better understanding.
:::
