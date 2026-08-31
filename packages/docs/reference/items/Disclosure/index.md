---
badges: [JS, Twig]
---

# Disclosure <Badges :texts="$frontmatter.badges" />

`Disclosure` shows and hides a panel from a native button while maintaining the button/panel ARIA relationship. It can work on its own or register with the closest `DisclosureGroup` for accordion constraints.

## Usage

After you install the [package](/guide/installation/), register `DisclosureGroup`. It declares `Disclosure` as a family member, so both are registered by the one call. The group coordinates the disclosures it claims but does not own their construction or lifecycle.

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { DisclosureGroup } from '@studiometa/ui';

registerComponent(DisclosureGroup);
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
