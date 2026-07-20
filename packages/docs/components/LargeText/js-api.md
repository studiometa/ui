---
title: LargeText JS API
---

# JS API

The `LargeText` component extends the [`Base` class](https://js-toolkit.studiometa.dev/api/configuration.html) and implements the [`withMountWhenInView` decorator](https://js-toolkit.studiometa.dev/api/decorators/withMountWhenInView.html). It inherits their respective APIs. See both linked references.

## Options

### `skew`

- Type: `boolean`
- Default: `false`

Enables skew.

### `sensitivity`

- Type: `number`
- Default: `1`

Sets the sensitivity.

### `skewSensitivity`

- Type: `number`
- Default: `1`

Sets the skew sensitivity.

::: warning
Remember to enable skew with the `skew` option.
:::

## Refs

### `target`

- Type: `HTMLElement`

The `LargeText` component should have a ref corresponding to its inner `HTMLElement` element.
