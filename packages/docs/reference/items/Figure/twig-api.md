---
title: Figure Twig API
outline: deep
---

# Twig API

## Parameters

:::tip Required parameters
The [`src`](#src) parameter is required.
:::

### `src`

- Type: `string`
- Required

Configures the `src` attribute of the image.

### `width`

- Type: `number`
- Default: `100`

Configures the `width` attribute of the image and the components sizing.

### `height`

- Type: `number`
- Default: `100`

Configures the `height` attribute of the image and the component sizing.

### `srcset`

- Type: `string`

Configures the `srcset` attribute of the image.

### `sizes`

- Type: `string`

Configures the `sizes` attribute of the image.

### `alt`

- Type: `string`

Configures the `alt` attribute of the image.

### `lazy`

- Type: `boolean`
- Default: `true`

Configures the type of loading for the image. Defaults to `true` which requires the `Figure` JavaScript component to be loaded in your project.

### `lazy_fallback`

- Type: `boolean`
- Default: `false`

Adds an image inside a `<noscript>` tag for SEO purpose when using the [`lazy` mode](#lazy).

### `caption`

- Type: `string`

The caption of the image.

### `fit`

- Type: `'cover'|'contain'|'fill'|'none'`

Defines how the image fits.

### `absolute`

- Type: `boolean`

Uses absolute position on the image holder instead of relative.

### `inline`

- Type: `boolean`

Whether to enable the display of the figure inline or not. When `inline`, the root element will have a max-width set corresponding to the `width` given. Use with caution.

### `placeholder`

- Type: `string`

Defines a custom placeholder instead of the generic placeholder:

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

Defines the color of the generic placeholder.

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

Customizes the image's caption. Defaults to the [`caption` parameter](#caption).
