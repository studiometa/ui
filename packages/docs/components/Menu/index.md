---
badges: [JS]
---

# Menu <Badges :texts="$frontmatter.badges" />

## Table of content

- [Examples](./examples.md)
- [JS API](./js-api.md)

## Usage

The `Menu` component and its children `MenuBtn` and `MenuList` can be used to create accessible menu with opening on click or on hover.

::: code-group

```js twoslash {2,8} [app.js]
import { Base, createApp } from '@studiometa/js-toolkit';
import { Menu } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Menu,
    },
  };
}

export default createApp(App);
```

```html [index.html]
<nav data-component="Menu" data-option-mode="click">
  <button type="button" data-component="MenuBtn">Toggle menu</button>
  <ul
    data-component="MenuList"
    data-option-enter-from="hidden"
    data-option-leave-to="hidden"
    class="hidden">
    <li>...</li>
    <li>...</li>
  </ul>
</nav>
```

<PreviewPlayground
  :html="() => import('./stories/dropdown/app.twig')"
  :script="() => import('./stories/dropdown/app.js?raw')"
  />


::: warning HTML Structure

A `Menu` component should only have one direct `MenuList` child and one direct `MenuBtn` child. In case of advanced menus, the `Menu` components can be nested inside one another.

:::

::: details Example of a nested `Menu` tree
```
┌ Menu
├─ MenuBtn
├─ MenuList
├───┬ Menu
│   ├─ MenuBtn
│   └─ MenuList
└───┬ Menu
    ├─ MenuBtn
    └─ MenuList
    …
```

:::
