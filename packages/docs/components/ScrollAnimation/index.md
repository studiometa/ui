---
badges: [JS]
---

# ScrollAnimation <Badges :texts="$frontmatter.badges" />

The `ScrollAnimation` component creates scroll-driven animations that respond to the viewport position, perfect for parallax effects, fade-ins, and other scroll-based interactions.

## Table of content

- [Examples](./examples.html)
- [JS API](./js-api.html)

## Usage

Once the [package installed](/guide/installation/), simply include the component in your project:

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
- **Variants**: Multiple specialized classes for different use cases

