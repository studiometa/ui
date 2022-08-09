---
title: Figure Twig API
outline: deep
---

# Twig API

## Parameters

:::tip Required parameters
The  [`src`](#src), [`width`](#width) and [`height`](#height) parameters are required.
:::

### `src`

- Type: `string`
- Required

Configure the `src` attribute of the image.

### `width`

- Type: `number`
- Required

Configure the `width` attribute of the image and the components sizing.

### `height`

- Type: `number`
- Required

Configure the `height` attribute of the image and the components sizing.

### `srcset`

- Type: `string`

Configure the `srcset` attribute of the image.

### `sizes`

- Type: `string`

Configure the `sizes` attribute of the image.

### `alt`

- Type: `string`

### `lazy`

- Type: `boolean`
- Default: `true`

Configure the type of loading for the image. Defaults to `true` which requires the `Figure` JavaScript component to be loaded in your project.

### `caption`

- Type: `string`

The caption of the image.

### `fit`

- Type: `'cover'|'contain'|'fill'|'none'`

Define how the image will fit.

### `absolute`

- Type: `boolean`

Use absolute position on the image holder instead of relative.

### `inline`

- Type: `boolean`

Wether to enable the display of the figure inline or not. When `inline`, the root element will have a max-width set corresponding to the `width` given. Use with caution.

### `attr`

- Type: `array`

Custom attributes for the root element.

### `inner_attr`

- Type: `array`

Custom attributes for the inner element.

### `img_attr`

- Type: `array`

Custom attributes for the image element.

### `caption_attr`

- Type: `array`

Custom attributes for the caption element.


## Blocks

### `caption`

Use this block to customize the image's caption, defaults to the [`caption` parameter](#caption).
