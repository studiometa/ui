---
title: ScrollTo JS API
---

# JS API

## Getter

### `targetSelector`

- Return: `string`
- Default: `this.$el.hash`

By default, this getter returns the hash portion of its root element as it must be an `<a>` element. Override it to scroll to another target.

When the document contains no element matching the selector, the click keeps its native behavior: the default is not prevented and no scroll is scheduled.
