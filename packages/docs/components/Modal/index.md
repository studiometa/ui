---
badges: [Twig, JS]
---

# Modal <Badges :texts="$frontmatter.badges" />

The `Modal` component creates accessible modal dialogs with focus management, keyboard navigation, and customizable styling.

## Table of content

- [Examples](./examples)
- [JS API](./js-api)
- [Twig API](./twig-api)

## Usage

Once the [package installed](/guide/installation/), simply include the template in your project:

```js{2,8}
import { Base, createApp } from '@studiometa/js-toolkit';
import { Modal } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Modal,
    },
  };
}

export default createApp(App, document.body);
```

```twig
{% include '@ui/Modal/Modal.twig' with {
  content: 'Your modal content here'
} %}
```

## Features

- **Accessibility**: Full ARIA support with proper focus management
- **Keyboard Navigation**: ESC to close, tab trapping within modal
- **Customizable**: Multiple blocks for customizing open/close buttons and content
- **Responsive**: Adapts to different screen sizes
- **Scroll Lock**: Prevents background scrolling when modal is open
- **Configurable**: Multiple options for positioning, styling, and behavior
