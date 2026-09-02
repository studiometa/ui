---
title: Marquee Twig API
outline: deep
---

# Twig API

Two templates render the same `Marquee` component. Both ship the `transform` that reads `--marquee-progress`, so neither needs a stylesheet to move.

## `Marquee.twig`

A horizontal marquee: the content, repeated, translated by `calc(var(--marquee-progress) * -100%)`.

Every copy after the first is taken out of the flow and offset by a multiple of the first copy's width, which makes the track exactly one copy wide — so `-100%` is one loop, and the loop is seamless whichever way it travels.

### Parameters

:::tip Required parameters
The [`content`](#content) parameter is required.
:::

#### `content`

- Type: `string`
- Required

The text content.

#### `repeat`

- Type: `number`
- Default: `2`

The number of times the content should be repeated. Repeat enough times to cover the widest viewport the marquee has to fill.

#### `attr`

- Type: `array`

Custom attributes for the root element. Options go here: `attr: { data_option_speed: 0.5 }`.

#### `track_attr`

- Type: `array`

Custom attributes for the track element. Its `style` is a **default** attribute, so passing one replaces the shipped `transform` — which is how another effect is composed onto it:

```twig
{% include '@ui/Marquee/Marquee.twig' with {
  content: 'Lorem ipsum',
  track_attr: {
    style: {
      transform: 'translateX(calc(var(--marquee-progress, 0) * -100%)) skewX(clamp(-15deg, calc(var(--marquee-velocity, 0) * 3deg), 15deg))'
    }
  }
} %}
```

## `CircularMarquee.twig`

A circular marquee: the content written along an SVG `textPath`, rotated by `calc(var(--marquee-progress) * -360deg)`.

It is Twig only — there is no `CircularMarquee` class. The geometry is all this template contributes, and the motion is the `Marquee` component it renders.

### Parameters

#### `id`

- Type: `string`
- Required

The marquee's id. It must be unique on the page: the `<textPath>` references the `<path>` by it.

#### `outer_radius`

- Type: `number`
- Default: `250`

The outer radius of the `<svg>`. Must be greater than `radius`, or the `<svg>` viewBox cuts the text off.

#### `radius`

- Type: `number`
- Default: `220`

The radius of the circle the text is written on. Must be smaller than `outer_radius`.

#### `cx`

- Type: `number`
- Default: `radius`

The horizontal centre of the path.

#### `cy`

- Type: `number`
- Default: `radius`

The vertical centre of the path.

#### `content`

- Type: `string`

The text to write around the circle. It is rendered raw.

#### `content_attr`

- Type: `array`

Custom attributes for the `<textPath>` element.

#### `speed`

- Type: `number`

Shortcut for `data-option-speed`. See [`speed`](/reference/items/Marquee/js-api#speed).

#### `sensitivity`

- Type: `number`

Shortcut for `data-option-sensitivity`. See [`sensitivity`](/reference/items/Marquee/js-api#sensitivity). A negative value spins the ring the other way.

#### `attr`

- Type: `array`

Custom attributes for the root element.
