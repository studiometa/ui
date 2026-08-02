---
title: CircularMarquee Twig API
outline: deep
---

# Twig API

## Parameters

### `id`

- Type: `string`

The Marquee id's. Mandatory to have it unique, as it is used inside the `<svg>` tag to make a reference

### `outer_radius`

- Type: `number`
- Default: `250`

The outer radius of the `<svg>`. Must be greater than `radius`.

### `radius`

- Type: `number`
- Default: `220`

The radius of the text in the `<svg>`. Must be smaller than `outer_radius`.

### `content`

- Type: `string`

The text to insert inside the CircularMarquee

### `content_attr`

- Type: `array`

Custom attributes for the content element.

### `sensitivity`

- Type: `number`
- Default: `0.1`

The sensitivity control the speed and direction of the animation.
A negative value makes it spin clockwise. The higher the value, the faster the animation will be.
