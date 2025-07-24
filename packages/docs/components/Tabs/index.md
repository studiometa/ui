---
badges: [JS, Twig]
---

# Tabs <Badges :texts="$frontmatter.badges" />

The `Tabs` component creates accessible tab interfaces with smooth transitions and keyboard navigation support.

## Table of content

- [Examples](./examples)
- [JS API](./js-api)
- [Twig API](./twig-api)

## Usage

Once the [package installed](/guide/installation/), simply include the template in your project:

```js{2,8}
import { Base, createApp } from '@studiometa/js-toolkit';
import { Tabs } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Tabs,
    },
  };
}

export default createApp(App, document.body);
```

```twig
{% set tabs = [
  {
    title: 'Tab 1',
    content: 'Content for tab 1'
  },
  {
    title: 'Tab 2', 
    content: 'Content for tab 2'
  },
  {
    title: 'Tab 3',
    content: 'Content for tab 3'
  }
] %}

{% include '@ui/Tabs/Tabs.twig' with { items: tabs } %}
```

## Features

- **Accessibility**: Full ARIA support with proper labeling and roles
- **Smooth Transitions**: Configurable CSS transitions between tabs
- **Keyboard Support**: Navigate tabs with keyboard
- **Customizable Styling**: Control appearance through styles options
- **Event System**: Listen to enable/disable events
- **Flexible Templates**: Multiple blocks for customizing appearance
