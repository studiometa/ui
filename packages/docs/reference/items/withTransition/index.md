---
badges: [JS]
---

# withTransition <Badges :texts="$frontmatter.badges" />

The `withTransition` decorator adds the declarative enter, leave and toggle behavior of the [`Transition` primitive](/reference/items/Transition/) to an existing js-toolkit component class.

## Usage

```ts
import { Base } from '@studiometa/js-toolkit';
import { withTransition } from '@studiometa/ui/withTransition';

class Togglable extends withTransition(Base) {}
```

Use the decorator when a component already extends another base class. Extend `Transition` directly when transition behavior is the component's primary responsibility.

See the [Transition usage guide](/reference/items/Transition/#use-the-decorator-to-make-an-existing-component-transitionable) and [JS API](/reference/items/Transition/js-api) for the shared options, methods and events.
