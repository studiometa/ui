---
title: Indexable JS API
outline: deep
---

# JS API

## Options

### `boundary`

- Type: `string`
- Default: `'clamp'`

Three boundary behaviors are available: `clamp`, `loop`, or `bounce`:

- **`clamp`**: stops when the index reaches `maxIndex`.
- **`loop`**: restarts from the beginning when the index reaches `maxIndex`.
- **`bounce`**: reverses direction and goes backward when the index reaches `maxIndex`.

<!-- prettier-ignore-start -->
```html {2}
<div
  data-component="Indexable"
  data-option-boundary="loop">
  ...
</div>
```
<!-- prettier-ignore-end -->

### `reverse`

- Type: `boolean`
- Default: `false`

Defines the initial direction of the count.

<!-- prettier-ignore-start -->
```html {2}
<div
  data-component="Indexable"
  data-option-reverse>
  ...
</div>
```
<!-- prettier-ignore-end -->
