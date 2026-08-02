---
badges: [JS]
---

# withScrollAnimationDebug <Badges :texts="$frontmatter.badges" />

The `withScrollAnimationDebug` decorator adds development-only visual markers and progress information to a `ScrollAnimationTimeline` class. It is exported separately so applications can keep debugging code out of production bundles.

## Usage

```ts
import { ScrollAnimationTimeline, withScrollAnimationDebug } from '@studiometa/ui/ScrollAnimation';

const DebugTimeline = withScrollAnimationDebug(ScrollAnimationTimeline);
```

See the complete [debug decorator API](/reference/items/ScrollAnimation/js-api#withscrollanimationdebug) and [debug example](/reference/items/ScrollAnimation/examples#debug-mode).
