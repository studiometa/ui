---
badges: [Twig, JS]
---

# Accordion <Badges :texts="$frontmatter.badges" />

::: warning Legacy component
`Accordion` remains available for backward compatibility. Use [`Disclosure` and `DisclosureGroup`](/reference/items/Disclosure/) for new work: they provide accessible `hidden`/`inert` state, independent dynamic child registration, nested groups and composable transitions without changing this legacy API.
:::

## Usage

After you install the [package](/guide/installation/), include the template in your project:

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { Accordion } from '@studiometa/ui';

registerComponent(Accordion);
```

```twig{16}
{% set items = [
  {
    title: 'Title #1',
    content: 'Content #1'
  },
  {
    title: 'Title #2',
    content: 'Content #2'
  },
  {
    title: 'Title #3',
    content: 'Content #3'
  }
] %}

{% include '@ui/Accordion/Accordion.twig' with { items: items } %}
```
