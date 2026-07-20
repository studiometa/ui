---
badges: [Twig, JS]
---

# Modal <Badges :texts="$frontmatter.badges" />

The `Modal` component creates accessible modal dialogs with focus management, keyboard navigation, and customizable styling.

## Usage

After you install the [package](/guide/installation/), include the template in your project:

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
