---
title: Cursor JS API
---

# JS API

The `Cursor` component extends the [`Base` class](https://js-toolkit-v4.studiometa.dev) using the pointer and animation-frame services. It inherits their respective APIs.

## Options

### `growSelectors`

- Type: `string`
- Default: `'a, a *, button, button *, [data-cursor-grow], [data-cursor-grow] *'`

Specifies which elements trigger a "Cursor grow".

### `shrinkSelectors`

- Type: `string`
- Default: `'[data-cursor-shrink], [data-cursor-shrink] *'`

Specifies which elements trigger a "Cursor shrink".

### `scale`

- Type: `number`
- Default: `1`

Sets the default scale of the cursor.

### `growTo`

- Type: `number`
- Default: `2`

Sets the scale of the cursor when it grows.

### `shrinkTo`

- Type: `number`
- Default: `0.5`

Sets the scale of the cursor when it shrinks.

### `translateDampFactor`

- Type: `number`
- Default: `0.25`

Sets the translate damp factor.

### `growDampFactor`

- Type: `number`
- Default: `0.25`

Sets the grow damp factor.

### `shrinkDampFactor`

- Type: `number`
- Default: `0.25`

Sets the shrink damp factor.
