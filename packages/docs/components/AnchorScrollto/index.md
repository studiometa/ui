---
badges: [JS]
---

# AnchorScrollTo <Badges :texts="$frontmatter.badges" />

The `AnchorScrollTo` atom is a small interface to the [`scrollTo` utility function](https://js-toolkit.studiometa.dev/utils/scrollTo.html) from the [@studiometa/js-toolkit package](https://js-toolkit.studiometa.dev).

::: warning
It should be used on `<a>` elements only.
:::

## Usage

This component can be directly imported and defined as a dependency of your application and set up to be instanciated on elements matching the `a[href^="#"]` selector:

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { AnchorScrollTo } from '@studiometa/ui';

registerComponent(AnchorScrollTo, 'a[href^="#"]');
```
