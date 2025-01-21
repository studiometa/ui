---
title: FigureShopify JS API
outline: deep
---

# JS API

The `FigureShopify` class extends the [`Figure` class](/components/Figure/js-api.html) and adds support for TwicPics API.

## Options

### `step`

- Type: `number`
- Default: `50`

The step used to round up image size calculation. Default to `50`, which means that a size of `320×380` will be rounded to `350×400`.

### `crop`

- Type: `string`
- Default: `'top' | 'left' | 'right' | 'bottom' | 'center'`

If the image should be cropped (cover like), use the `crop` option with one the allowed value.

### `disable`

- Type: `boolean`
- Default: `false`

Use this option to disable the features of this component.
