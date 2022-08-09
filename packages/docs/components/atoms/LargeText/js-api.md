---
title: LargeText JS API
---

# JS API

The `LargeText` component extends the [`Base` class](https://js-toolkit.studiometa.dev/api/configuration.html) and implements the [`withMountWhenInView` decorator](https://js-toolkit.studiometa.dev/api/decorators/withMountWhenInView.html). It inherits their respective APIs, so make sur have a look at them.

## Options

### `skew`

- Type: `boolean`
- Default: `false`

Use this options to enable skew.

### `sensitivity`

- Type: `number`
- Default: `1`

Use this options to set the sensitivity.

### `skewSensitivity`

- Type: `number`
- Default: `1`

Use this options to set the skew sensitivity.

::: warning
Remember to enable skew with the `skew` option.
:::

## Refs

### `target`

- Type: `HTMLElement`

The `LargeText` component should have a ref corresponding to its inner `<span />` element.
