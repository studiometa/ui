---
badges: [JS]
---

# ScrollTo <Badges :texts="$frontmatter.badges" />

The `ScrollTo` component is a small interface to the `scrollTo` utility function from the [@studiometa/js-toolkit package](https://js-toolkit-v4.studiometa.dev).

::: warning
It should be used on `<a>` elements only.
:::

::: tip Renamed in v2
`ScrollTo` was named `AnchorScrollTo` in v1.
:::

## Usage

Register the component and mark the anchors it should enhance:

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { ScrollTo } from '@studiometa/ui';

registerComponent(ScrollTo);
```

```html
<a href="#section" data-component="ScrollTo">Go to section</a>
```

::: warning No selector registration
js-toolkit v4 mounts a component from its `data-component` token only — `registerComponent()` takes no selector. Add the attribute when you render the links, or add it from your own script when the markup is not yours.
:::
