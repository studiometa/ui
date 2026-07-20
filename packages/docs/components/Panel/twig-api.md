---
title: Panel Twig API
---

# Twig API

The `Panel` component extends the [`Modal` component](/components/Modal/twig-api.md) and inherits all its parameters and blocks.

## Parameters

### `position`

- Type: `'top' | 'right' | 'bottom' | 'left'`
- Default: `'left'`

Defines from which edge of the screen the panel slides in. This affects the panel positioning, sizing, and animation direction:

- `'top'`: Panel slides down from the top edge, full width
- `'right'`: Panel slides in from the right edge, full height
- `'bottom'`: Panel slides up from the bottom edge, full width
- `'left'`: Panel slides in from the left edge, full height

### `wrapper_attr`

- Type: `array`

Customizes the wrapper element attributes. The wrapper positioning is automatically adjusted based on the `position` parameter to properly align the panel.

## Inherited Parameters

All parameters from the [Modal component](/components/Modal/twig-api.md) are available:

- `attr` - Root element attributes
- `modal_attr` - Modal container attributes
- `overlay_attr` - Background overlay attributes
- `container_attr` - Content container attributes
- `content_attr` - Inner content attributes

## Blocks

All blocks from the [Modal component](/components/Modal/twig-api.md) are inherited:

### `open`

Customizes the open trigger button.

### `close`

Customizes the close trigger button.

### `content`

Sets the panel's content. This is the main content of the slide-in panel.
