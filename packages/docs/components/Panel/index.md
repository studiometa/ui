---
badges: [Twig, JS]
---

# Panel <Badges :texts="$frontmatter.badges" />

The `Panel` component extends the `Modal` component to create slide-in panels from any edge of the screen with smooth animations.

## Table of content

- [Examples](./examples)
- [JS API](./js-api)
- [Twig API](./twig-api)

## Usage

Once the [package installed](/guide/installation/), simply include the template in your project:

```js{2,8}
import { Base, createApp } from '@studiometa/js-toolkit';
import { Panel } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Panel,
    },
  };
}

export default createApp(App, document.body);
```

```twig
{% include '@ui/Panel/Panel.twig' with {
  position: 'right',
  content: 'Your panel content here'
} %}
```

## Features

- **Four Positions**: Slide in from top, right, bottom, or left
- **Smooth Animations**: CSS transitions for opening and closing
- **Modal Inheritance**: All Modal features including accessibility and keyboard navigation
- **Responsive**: Adapts to different screen sizes
- **Customizable**: Full control over styling and positioning
- **Overlay**: Semi-transparent background overlay with fade animation
