---
badges: [JS]
---

# ScrollAnimation <Badges :texts="$frontmatter.badges" />

The `ScrollAnimation` component creates scroll-driven animations that respond to the viewport position, perfect for parallax effects, fade-ins, and other scroll-based interactions.

## Table of content

- [Examples](./examples.md)
- [JS API](./js-api.md)

## Usage

For the best performance and flexibility, use `ScrollAnimationTimeline` with `ScrollAnimationTarget` children:

```js{2,8-9}
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
    data-option-play-range='[0, 0.5]'
  >
    First element
  </div>
  <div
    data-component="ScrollAnimationTarget"
    data-option-from='{"opacity": 0, "translateY": "100px"}'
    data-option-to='{"opacity": 1, "translateY": "0px"}'
    data-option-play-range='[0.5, 1]'
  >
    Second element
  </div>
</div>
```

## Legacy usage

The `ScrollAnimation` component can be used standalone for simple use cases, but it is **deprecated** in favor of the timeline API.

```js{2,8}
import { Base, createApp } from '@studiometa/js-toolkit';
import { ScrollAnimation } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      ScrollAnimation,
    },
  };
}

export default createApp(App, document.body);
```

```html
<div
  data-component="ScrollAnimation"
  data-option-from='{"opacity": 0, "translateY": "100px"}'
  data-option-to='{"opacity": 1, "translateY": "0px"}'
>
  <div data-ref="target">
    Content to animate
  </div>
</div>
```

## Features

- **Scroll-driven**: Animations progress based on scroll position
- **Flexible Animation**: Support for CSS transforms, opacity, and other properties
- **Keyframe Support**: Define complex animations with multiple keyframes
- **Easing Control**: Customize animation timing with cubic-bezier easing
- **Play Range**: Control when animation starts and ends during scroll
- **Performance**: Optimized with intersection observer and RAF
- **Timeline Support**: Coordinate multiple animations with `ScrollAnimationTimeline` and `ScrollAnimationTarget`
- **Variants**: Multiple specialized classes for different use cases

## Deprecated components

:::warning Deprecated
The following components are deprecated and will be removed in a future version. Use `ScrollAnimationTimeline` and `ScrollAnimationTarget` instead:

- `ScrollAnimation` → use `ScrollAnimationTimeline` and `ScrollAnimationTarget`
- `ScrollAnimationParent` → use `ScrollAnimationTimeline`
- `ScrollAnimationChild` → use `ScrollAnimationTarget`
- `ScrollAnimationChildWithEase` → use `ScrollAnimationTarget`
- `ScrollAnimationWithEase` → use `ScrollAnimationTimeline` and `ScrollAnimationTarget`
- `animationScrollWithEase` → no replacement
:::

