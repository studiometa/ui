---
title: ScrollAnimation JS API
---

# JS API

## Refs

### `target`

HTMLElement reference for the element to animate. If not provided, the component's root element will be used.

## Options

### `playRange`

- Type: `[number, number] | [number, number, number]`
- Default: `[0, 1]`

Define the scroll progress range when the animation should play. Values between 0 and 1, where 0 is when the element enters the viewport and 1 is when it exits.

This can be useful to create timelines where elements should be animated sequentially.

```html {3,8}
<div
  data-component="ScrollAnimation"
  data-option-play-range="[0, 0.5]">
  <div data-ref="target">...</div>
</div>
<div
  data-component="ScrollAnimation"
  data-option-play-range="[0.5, 1]">
  <div data-ref="target">...</div>
</div>
```

#### Staggered animation

Staggered scroll animation can be created by giving 3 numbers to the `playRange` option:

- `index`: the current index of the items in the staggered list
- `length`: the length of the staggered items
- `step`: the delay to apply between each item in the staggered list

```html {3,8}
<div
  data-component="ScrollAnimation"
  data-option-play-range="[0, 2, 0.1]">
  <div data-ref="target">...</div>
</div>
<div
  data-component="ScrollAnimation"
  data-option-play-range="[1, 2, 0.1]">
  <div data-ref="target">...</div>
</div>
```

The following example uses Twig `loop.index0` and `loop.length` variables to generate `data-option-play-range` attributes with a staggered effect.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/staggered/app.twig')"
  :script="() => import('./stories/staggered/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/staggered/app.twig
<<< ./stories/staggered/app.js

:::

</llm-only>

#### Sequentially ordered animation

Use the `[index, length, step]` format for the `data-option-play-range` attribute value with a `step` value set to `1 / length` to make each animation play sequentially.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/sequence/app.twig')"
  :script="() => import('./stories/sequence/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/sequence/app.twig
<<< ./stories/sequence/app.js

:::

</llm-only>

### `from`

- Type: `object`
- Default: `{}`

Initial keyframe for the animation. Define CSS properties as key-value pairs.

```html {3}
<div
  data-component="ScrollAnimation"
  data-option-from='{ "opacity": 0, "y": 100 }'>
  <div data-ref="target">...</div>
</div>
```

### `to`

- Type: `object`
- Default: `{}`

Final keyframe for the animation. Define CSS properties as key-value pairs.

```html {3}
<div
  data-component="ScrollAnimation"
  data-option-to='{ "opacity": 0, "y": 100 }'>
  <div data-ref="target">...</div>
</div>
```

### `keyframes`

- Type: `keyFrame[]`
- Default: `[]`

Array of keyframes for complex animations. When provided, `from` and `to` are ignored.

```html
<div
  data-component="ScrollAnimation"
  data-option-keyframes='[
    { "--opacity": 0, "scale": 0.8 },
    { "--opacity": 0.5, "scale": 1.1 },
    { "--opacity": 1, "scale": 1 }
  ]'>
  <div
    data-ref="target"
    style="opacity: var(--opacity, 0);">
    ...
  </div>
</div>
```

See the following types defintions and [the `animate` documentation](https://js-toolkit.studiometa.dev/utils/css/animate.html) for more advanced documentation on keyframes.

```ts twoslash
import { TransformProps } from '@studiometa/js-toolkit/utils';

type EasingFunction = (value: number) => number;
type BezierCurve = [number, number, number, number];
type CSSCustomPropertyName = `--${string}`;

interface KeyFrame extends TransformProps {
  opacity?: number;
  transformOrigin?: string;
  easing?: EasingFunction | BezierCurve;
  offset?: number;
  [key: CSSCustomPropertyName]: number;
}
```

### `easing`

- Type: `[number, number, number, number]`
- Default: `[0, 0, 1, 1]`

Cubic-bezier easing values for the animation timing.

```html
<div data-component="ScrollAnimation" data-option-easing="[0.19, 1, 0.22, 1]">...</div>
```

#### Common easing values

| Easing     | Cubic bezier                  |
| ---------- | ----------------------------- |
| Linear     | `[0, 0, 1, 1]`                |
| InBack     | `[0.6, -0.28, 0.735, 0.045]`  |
| InCirc     | `[0.6, 0.04, 0.98, 0.335]`    |
| InCubic    | `[0.55, 0.055, 0.675, 0.19]`  |
| InExpo     | `[0.95, 0.05, 0.795, 0.035]`  |
| InQuad     | `[0.55, 0.085, 0.68, 0.53]`   |
| InQuart    | `[0.895, 0.03, 0.685, 0.22]`  |
| InQuint    | `[0.755, 0.05, 0.855, 0.06]`  |
| InSine     | `[0.47, 0, 0.745, 0.715]`     |
| OutBack    | `[0.175, 0.885, 0.32, 1.275]` |
| OutCirc    | `[0.075, 0.82, 0.165, 1]`     |
| OutCubic   | `[0.215, 0.61, 0.355, 1]`     |
| OutExpo    | `[0.19, 1, 0.22, 1]`          |
| OutQuad    | `[0.25, 0.46, 0.45, 0.94]`    |
| OutQuart   | `[0.165, 0.84, 0.44, 1]`      |
| OutQuint   | `[0.23, 1, 0.32, 1]`          |
| OutSine    | `[0.39, 0.575, 0.565, 1]`     |
| InOutBack  | `[0.68, -0.55, 0.265, 1.55]`  |
| InOutCirc  | `[0.785, 0.135, 0.15, 0.86]`  |
| InOutCubic | `[0.645, 0.045, 0.355, 1]`    |
| InOutExpo  | `[1, 0, 0, 1]`                |
| InOutQuad  | `[0.455, 0.03, 0.515, 0.955]` |
| InOutQuart | `[0.77, 0, 0.175, 1]`         |
| InOutQuint | `[0.86, 0, 0.07, 1]`          |
| InOutSine  | `[0.445, 0.05, 0.55, 0.95]`   |

## Methods

### `render(progress)`

- Parameters:
  - `progress` (`number`): animation progress between 0 and 1
- Returns: `void`

Manually render the animation at a specific progress value.

## Properties

### `target`

- Type: `HTMLElement`

The element being animated (either the `target` ref or the component's root element).

### `animation`

- Type: `Animation`

The animation instance created from the keyframes and easing options. See [`animate` documentation](https://js-toolkit.studiometa.dev/utils/css/animate.html).
