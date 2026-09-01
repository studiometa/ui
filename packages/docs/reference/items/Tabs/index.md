---
badges: [JS, Twig]
---

# Tabs <Badges :texts="$frontmatter.badges" />

The `Tabs` component implements the [WAI-ARIA Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/): one tab list, one panel visible at a time, roving focus on the arrow keys, and the `tablist` / `tab` / `tabpanel` roles wired to each other.

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

{% include '@ui/Tabs/Tabs.twig' with { items: tabs, label: 'Product details' } %}
```

`label` names the tab list for assistive technology. The pattern requires it, and the component reports `tabs.unnamed-tablist` on the diagnostic channel when it is missing.

## Rewritten in v2

`Tabs` was rewritten rather than ported. The `styles` option is removed, the events are namespaced, and the ARIA contract the v1 component only half wrote is implemented. See the [migration guide](/migration-guides/1.0-2.0/#tabs) and the [JavaScript API](./js-api.md).
