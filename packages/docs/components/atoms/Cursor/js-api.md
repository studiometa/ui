---
title: Cursor JS API
---

# JS API

The `Cursor` component extends the [`Base` class](https://js-toolkit.studiometa.dev/api/configuration.html) using the [Pointer Service](https://js-toolkit.studiometa.dev/api/services/usePointer.html). It inherits their respective APIs, so make sur have a look at them.

## Options

### `growSelectors`

- Type: `string`
- Default: `'a, a *, button, button *, [data-cursor-grow], [data-cursor-grow] *'`

Use this options to specify wich elements that trigger a "Cursor grow".

### `shrinkSelectors`

- Type: `string`
- Default: `'[data-cursor-shrink], [data-cursor-shrink] *'`

Use this options to specify wich elements that trigger a "Cursor shrink".

### `scale`

- Type: `number`
- Default: `1`

Use this options to set the default scale of the cursor.

### `growTo`

- Type: `number`
- Default: `2`

Use this options to set the scale of the cursor when it grows.

### `shrinkTo`

- Type: `number`
- Default: `0.5`

Use this options to set the scale of the cursor when it shrinks.

### `translateDampFactor`

- Type: `number`
- Default: `0.25`

Use this options to set the translate damp factor.

### `growDampFactor`

- Type: `number`
- Default: `0.25`

Use this options to set the grow damp factor.

### `shrinkDampFactor`

- Type: `number`
- Default: `0.25`

Use this options to set the shrink damp factor.
