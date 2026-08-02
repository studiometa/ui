---
badges: [JS, Twig]
---

# Disclosure <Badges :texts="$frontmatter.badges" />

`Disclosure` shows and hides a panel from a native button while maintaining the button/panel ARIA relationship. It can work on its own or register with the closest `DisclosureGroup` for accordion constraints.

## Usage

After you install the [package](/guide/installation/), register both components independently. `DisclosureGroup` coordinates registered children but does not instantiate them.

```js
import { registerComponents } from '@studiometa/js-toolkit';
import { Disclosure, DisclosureGroup } from '@studiometa/ui';

registerComponents(Disclosure, DisclosureGroup);
```

```twig
{% set items = [
  {
    title: 'What is a disclosure?',
    content: 'A button that controls the visibility of a panel.',
    open: true
  },
  {
    title: 'Can several panels be open?',
    content: 'Yes. Configure the DisclosureGroup multiple option.'
  }
] %}

{% include '@ui/Disclosure/Disclosure.twig' with {
  id: 'faq',
  items: items,
  attr: { data_option_no_multiple: true }
} %}
```

The example above is single-open and collapsible: opening one item closes the previous item, and the open item can be closed. Register only `Disclosure` when no group coordination is needed.

See the [anatomy](./anatomy.md), [JavaScript API](./js-api.md), [Twig API](./twig-api.md), and [examples](./examples.md).
