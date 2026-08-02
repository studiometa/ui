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

### `total`

- Type: `number`
- Default: `0`

Defines the number of items to navigate through. It sets the `length` property, allowing the `Indexable` component to be used standalone without extending it. Subclasses may override the `length` getter to derive it from their content instead.

<!-- prettier-ignore-start -->
```html {2}
<div
  data-component="Indexable"
  data-option-total="3">
  ...
</div>
```
<!-- prettier-ignore-end -->
