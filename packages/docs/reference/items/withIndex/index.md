---
badges: [JS]
---

# withIndex <Badges :texts="$frontmatter.badges" />

The `withIndex` decorator adds the bounded, navigable current index of the [`Indexable` primitive](/reference/items/Indexable/) to an existing js-toolkit component class.

## Usage

```ts
import { Base } from '@studiometa/js-toolkit';
import { withIndex } from '@studiometa/ui/withIndex';

class Gallery extends withIndex(Base) {}
```

Use the decorator when a component already extends another base class. Extend [`Indexable`](/reference/items/Indexable/) directly when index management is the component's primary responsibility — that class is `withIndex(Base)` and the component name, nothing more, so the two forms share one implementation.

```ts
import { Transition } from '@studiometa/ui/Transition';
import { withIndex } from '@studiometa/ui/withIndex';

// Already a `Transition`, and now indexable too.
class Gallery extends withIndex(Transition) {
  static config = {
    name: 'Gallery',
  };
}
```

The decorator carries the `boundary`, `reverse` and `total` options in its own config, so a consumer declares none of them. It carries no `name`: the class it is applied to keeps its own identity.

See the [`Indexable` usage guide](/reference/items/Indexable/) and [JS API](/reference/items/Indexable/js-api) for the shared options, properties, methods and events.

## Types

`IndexableInterface` describes what the decorator adds to the class it is applied to — the `currentIndex`, `boundary`, `isReverse` and `length` accessors, and the `goTo()`, `goNext()` and `goPrev()` methods. `IndexableProps` types the options and events it contributes.
