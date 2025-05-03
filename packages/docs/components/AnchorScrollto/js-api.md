---
title: AnchorScrollTo JS API
---

# JS API
## Getter

### `targetSelector`

- Return: `string | HTMLElement | number | { left?: number, top?: number }`
- Default: `this.$el.hash`

By default, this getter returns the hash portion of its root element as it must be an `<a>` element.
