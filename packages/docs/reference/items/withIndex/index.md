---
badges: [JS]
---

# withIndex <Badges :texts="$frontmatter.badges" />

The `withIndex` decorator adds index navigation, boundary handling and index events to an existing js-toolkit component class. It is the decorator equivalent of the [`Indexable` primitive](/reference/items/Indexable/).

## Usage

```ts
import { Base } from '@studiometa/js-toolkit';
import { withIndex } from '@studiometa/ui/withIndex';

class Paginated extends withIndex(Base) {
  get length() {
    return 10;
  }
}
```

See the [Indexable usage guide](/reference/items/Indexable/) and [JS API](/reference/items/Indexable/js-api) for boundary modes, instructions, methods and events.
