---
badges: [JS]
---

# ScrollAnimation <Badges :texts="$frontmatter.badges" />

The `ScrollAnimation` component creates scroll-driven animations that respond to the viewport position, for effects such as parallax and fade-ins.

## Usage

For the best performance and flexibility, use `ScrollAnimationTimeline` with `ScrollAnimationTarget` children:

```js {2,8-9}
import { Base, createApp } from '@studiometa/js-toolkit';
import { ScrollAnimationTimeline, ScrollAnimationTarget } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      ScrollAnimationTimeline,
      ScrollAnimationTarget,
    },
  };
}

export default createApp(App, document.body);
```

```html
<div data-component="ScrollAnimationTimeline">
  <div
    data-component="ScrollAnimationTarget"
    data-option-from='{"opacity": 0, "translateY": "100px"}'
    data-option-to='{"opacity": 1, "translateY": "0px"}'
    data-option-play-range="[0, 0.5]">
    First element
  </div>
  <div
    data-component="ScrollAnimationTarget"
    data-option-from='{"opacity": 0, "translateY": "100px"}'
    data-option-to='{"opacity": 1, "translateY": "0px"}'
    data-option-play-range="[0.5, 1]">
    Second element
  </div>
</div>
```

## Deprecated components

:::warning Deprecated

The standalone `ScrollAnimation` component and the `ScrollAnimationParent`, `ScrollAnimationChild`, `ScrollAnimationChildWithEase`, `ScrollAnimationWithEase`, and `animationScrollWithEase` classes are deprecated in favor of `ScrollAnimationTimeline` and `ScrollAnimationTarget`.

See the [v1 → v2 migration guide](/migration-guides/1.0-2.0/) for the full mapping and before/after examples.

:::
