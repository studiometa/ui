---
title: ScrollAnimation JS API
---

# JS API

## Refs

### `target`

HTMLElement reference for the element to animate. If not provided, the component's root element will be used.

## Options

### `playRange`

- Type: `[number, number]`
- Default: `[0, 1]`

Define the scroll progress range when the animation should play. Values between 0 and 1, where 0 is when the element enters the viewport and 1 is when it exits.

### `from`

- Type: `object`
- Default: `{}`

Initial keyframe for the animation. Define CSS properties as key-value pairs.

```html
data-option-from='{"opacity": 0, "translateY": "100px"}'
```

### `to`

- Type: `object`
- Default: `{}`

Final keyframe for the animation. Define CSS properties as key-value pairs.

```html
data-option-to='{"opacity": 1, "translateY": "0px"}'
```

### `keyframes`

- Type: `array`
- Default: `[]`

Array of keyframes for complex animations. When provided, `from` and `to` are ignored.

```html
data-option-keyframes='[
  {"opacity": 0, "scale": 0.8},
  {"opacity": 0.5, "scale": 1.1},
  {"opacity": 1, "scale": 1}
]'
```

### `easing`

- Type: `[number, number, number, number]`
- Default: `[0, 0, 1, 1]`

Cubic-bezier easing values for the animation timing.

## Methods

### `render(progress)`

- Parameters: `progress` (number) - Animation progress between 0 and 1
- Returns: `void`

Manually render the animation at a specific progress value.

### `scrolledInView(props)`

- Parameters: `props` (ScrollInViewProps) - Scroll information from the intersection observer
- Returns: `void`

Internal method called when the element scrolls in view. Calculates progress and calls render.

## Properties

### `target`

- Type: `HTMLElement`

The element being animated (either the `target` ref or the component's root element).

### `animation`

- Type: `Animation`

The animation instance created from the keyframes and easing options.
