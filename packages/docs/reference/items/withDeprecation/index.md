---
badges: [JS]
---

# withDeprecation <Badges :texts="$frontmatter.badges" />

The `withDeprecation` decorator marks a js-toolkit component class as deprecated and emits a development warning when an instance is created.

## Usage

```ts
import { Base } from '@studiometa/js-toolkit';
import { withDeprecation } from '@studiometa/ui/withDeprecation';

class LegacyComponent extends withDeprecation(Base) {
  static config = {
    name: 'LegacyComponent',
  };
}
```

Use this decorator for compatibility components that remain available during a migration period. Document the replacement and removal plan on the deprecated component's own page.
