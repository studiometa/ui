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

This component can be directly imported and defined as a dependency of your application and set up to be instanciated on elements matching the `a[href^="#"]` selector:

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { ScrollTo } from '@studiometa/ui';

registerComponent(ScrollTo, 'a[href^="#"]');
```
