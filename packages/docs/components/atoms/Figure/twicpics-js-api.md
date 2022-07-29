---
outline: deep
---

# FigureTwicpics JS API

The `FigureTwicpics` class extends the `Figure` class and adds support for TwicPics API support.

## Options

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

## Getter

### `domain`

- Return: `string`

A getter to override in a child class in order to define the main host on which the image should be server by Twicpics. It will be used to replace the host of the image source.
