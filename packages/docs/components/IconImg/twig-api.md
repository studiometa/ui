---
title: IconImg Twig API
---

# Twig API

## Parameters

### `name`

- Type: `string`

The filename of the icon, as found in the folder corresponding to the `@svg` alias or any `collection:icon-name` combination from [Iconify](https://icon-sets.iconify.design/).

### `ignore_missing`

- Type: `boolean`

Avoid printing of `<img>` with empty `src`.

### `attr`

- Type: `array[]`

Additional attributes to add to the `<img>` element.

### `css_vars`

- Type: `array`

Custom CSS variables to pass to the SVG.

### `current_color`

- Type: `string`

Custom color for the `currentColor` CSS variable in the SVG.
