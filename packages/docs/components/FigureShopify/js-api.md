---
title: FigureShopify JS API
outline: deep
---

# JS API

The `FigureShopify` class extends the [`Figure` class](/components/Figure/js-api.md) and formats image sources for the [Shopify CDN image API](https://shopify.dev/docs/api/liquid/filters/image_url).

## Options

### `step`

- Type: `number`
- Default: `50`

The step used to round up image size calculation. Default to `50`, which means that a size of `320×380` will be rounded to `350×400`.

### `crop`

- Type: `'top' | 'left' | 'right' | 'bottom' | 'center'`
- Default: `null`

Crops the image towards the given edge or its center, like `object-fit: cover`. When `null`, the image is not cropped.

### `disable`

- Type: `boolean`
- Default: `false`

Disables the features of this component.
