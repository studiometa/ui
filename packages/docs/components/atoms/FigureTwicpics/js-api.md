---
title: FigureTwicpics JS API
outline: deep
---

# JS API

The `FigureTwicpics` class extends the [`Figure` class](/components/atoms/Figure/js-api.html) and adds support for TwicPics API.

## Options

### `domain`

- Type: `string`
- Default: `''`

Use this option to configure your Twicpics domain.

### `path`

- Type: `string`
- Default: `''`

Use this option to configure your Twicpics path.

### `transform`

- Type: `string`
- Default: `''`

Use this option to add transforms to the image with [TwicPics URL API](https://www.twicpics.com/docs/api/basics).

### `step`

- Type: `number`
- Default: `50`

The step used to round up image size calculation. Default to `50`, which means that a size of `320×380` will be rounded to `350×400`.

### `mode`

- Type: `string`
- Default: `'cover'`

The mode used to resize and crop the image. It can be any key of the [transformations API](https://www.twicpics.com/docs/api/transformations) of TwicPics which accepts a size as value.

### `dpr`

- Type: `boolean`
- Default: `true`

Use this option to disable the support of the Device Pixel Ratio (DPR) with `data-option-no-dpr` attribute.

## Getter

### `domain`

- Return: `string`

A getter to override in a child class in order to define the main host on which the image should be served by Twicpics. It will be used to replace the host of the image source.

### `path`

- Return: `string`

A getter to override in a child class in order to define the path on which the image should be server by Twicpics. It will be used to prefix the pathname of the image source.
