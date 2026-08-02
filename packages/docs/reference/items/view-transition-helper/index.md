---
badges: [JS]
---

# viewTransition <Badges :texts="$frontmatter.badges" />

The `viewTransition` helper schedules an update with the browser View Transitions API and returns a promise that resolves when the transition finishes. When the API is unavailable, it applies the update immediately.

## Usage

```ts
import { viewTransition } from '@studiometa/ui/scheduler';

await viewTransition(() => {
  document.body.classList.toggle('alternate-view');
});
```

Use the [`ViewTransition` primitive](/reference/items/ViewTransition/) when the state change belongs to a js-toolkit component. Use this helper for standalone DOM updates.
