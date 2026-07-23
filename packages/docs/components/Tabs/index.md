---
badges: [JS, Twig]
---

# Tabs <Badges :texts="$frontmatter.badges" />

The `Tabs` component creates accessible tab interfaces with transitions and keyboard navigation support.

## Usage

After you install the [package](/guide/installation/), include the template in your project:

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { Tabs } from '@studiometa/ui';

registerComponent(Tabs);
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
