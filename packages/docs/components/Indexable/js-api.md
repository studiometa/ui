---
title: Indexable JS API
outline: deep
---

# JS API

## Options

### `mode`

- Type: `String`
- Default: `'normal'`

Three modes are available: `normal`, `infinite`, or `alternate`:

- **Normal**: stops when the index reaches `maxIndex`.
- **Infinite**: restarts from the beginning when the index reaches `maxIndex`.
- **Alternate**: bounces back and goes backward when the index reaches `maxIndex`.

```html {2}
<div data-component="Indexable" data-option-mode="infinite">
  ...
</div>
```

### `reverse`

- Type: `Boolean`
- Default: `false`

Defines the initial direction of the count.

```html {2}
<div data-component="Indexable" data-option-reverse>
  ...
</div>
```
