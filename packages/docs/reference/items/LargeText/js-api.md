---
title: LargeText JS API
---

# JS API

The `LargeText` component declares the `in-view:50%` [mount strategy](/guide/autoloading/#mount-strategies), so it mounts half a viewport before it scrolls in and unmounts once it is that far past. Override the margin per element with `data-mount="in-view:<rootMargin>"`.

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
