---
title: Figure Twig API
outline: deep
---

# Twig API

## Parameters

:::tip Required parameters
The [`src`](#src) or [`sources`](#sources) parameters are required, [`width`](#width) and [`height`](#height) too.
:::

### `src`

- Type: `string`
- Required if [`sources`](#sources) is empty.

Configure the `src` attribute of the video.

### `sources`

- Type: `array<object>`
- Required if [`src`](#src) is empty.

Configure multiple sources of the video. Sources must contain at least one object with `src` key.

### `width`

- Type: `number`
- Default: `100`

Configure the `width` attribute of the image and the components sizing.

### `height`

- Type: `number`
- Required

Configure the `height` attribute of the image and the components sizing.

### `lazy`

- Type: `boolean`
- Default: `true`

Configure the type of loading for the video. Defaults to `true` which requires the `FigureVideo` JavaScript component to be loaded in your project.

### `caption`

- Type: `string`

The caption of the video.

### `fit`

- Type: `'cover'|'contain'|'fill'|'none'`

Define how the video will fit.

### `absolute`

- Type: `boolean`

Use absolute position on the video holder instead of relative.

### `inline`

- Type: `boolean`

Wether to enable the display of the figure inline or not. When `inline`, the root element will have a max-width set corresponding to the `width` given. Use with caution.

### `placeholder`

- Type: `string`

Use a custom placeholder instead of the generic placeholder:
```twig
{%- set placeholder_markup -%}
  <svg xmlns="http://www.w3.org/2000/svg"
    viewbox="0 0 {{ width }} {{ height }}"
    width="{{ width }}"
    height="{{ height }}">
    <rect x="0" y="0" width="{{ width }}" height="{{ height }}" fill="{{ placeholder_color }}" />
  </svg>
{%- endset -%}
{% set generic_placeholder = 'data:image/svg+xml,%s'|format(placeholder_markup|url_encode) %}
```

### `placeholder_color`

- Type: `string`
- Default: `"#eee"`

Define the color of the generic placeholder.

### `attr`

- Type: `array`

Custom attributes for the root element.

### `inner_attr`

- Type: `array`

Custom attributes for the inner element.

### `video_attr`

- Type: `array`

Custom attributes for the video element.

### `caption_attr`

- Type: `array`

Custom attributes for the caption element.

## Blocks

### `caption`

Use this block to customize the video's caption, defaults to the [`caption` parameter](#caption).

### `sources`

Use this block to customize the video's sources, defaults to the [`sources` parameter](#sources).
