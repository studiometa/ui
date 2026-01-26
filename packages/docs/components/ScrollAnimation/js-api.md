---
title: ScrollAnimation JS API
---

# JS API

## ScrollAnimationTimeline

A parent component that manages scroll-based animations for its children `ScrollAnimationTarget` components. The timeline watches for its position in the viewport and propagates the scroll progress to all its children.

This component is based on the [`withScrolledInView`](https://js-toolkit.studiometa.dev/api/decorators/withScrolledInView.html) decorator from the `@studiometa/js-toolkit` package and inherits all of its options.

### Usage

```js
import { Base, createApp } from '@studiometa/js-toolkit';
import { ScrollAnimationTimeline, ScrollAnimationTarget } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      ScrollAnimationTimeline,
      ScrollAnimationTarget,
    },
  };
}

export default createApp(App, document.body);
```

```html
<div data-component="ScrollAnimationTimeline">
  <div
    data-component="ScrollAnimationTarget"
    data-option-from='{"opacity": 0}'
    data-option-to='{"opacity": 1}'>
    Content
  </div>
</div>
```

### Options

#### `debug`

- Type: `boolean`
- Default: `false`

Enable debug mode to display visual markers showing the scroll animation's start/end positions and current progress. This is useful during development to understand how the scroll animation is triggered.

:::warning
To use the debug option, you must wrap your `ScrollAnimationTimeline` with the `withScrollAnimationDebug` decorator. This allows the debug code to be tree-shaken from production bundles.
:::

When enabled, the following elements are displayed:
- A dashed outline around the timeline element
- Start and end markers on the right side of the viewport
- A progress bar and percentage indicator

```js {5,12}
import { Base, createApp } from '@studiometa/js-toolkit';
import {
  ScrollAnimationTimeline,
  ScrollAnimationTarget,
  withScrollAnimationDebug,
} from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      ScrollAnimationTimeline: withScrollAnimationDebug(ScrollAnimationTimeline),
      ScrollAnimationTarget,
    },
  };
}
```

<!-- prettier-ignore-start -->
```html {2}
<div data-component="ScrollAnimationTimeline"
  data-option-debug>
  <div data-component="ScrollAnimationTarget" ...>
    ...
  </div>
</div>
```
<!-- prettier-ignore-end -->

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/debug/app.twig')"
  css=" "
  :css-editor="false"
  :script="() => import('./stories/debug/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/debug/app.twig
<<< ./stories/debug/app.js

:::

</llm-only>

#### `offset`

- Type: `string`
- Default: `"start end / end start"`

Defines the limits used to calculate the progress of the scroll. The value is a string composed of two parts separated by a slash (`/`). Each part defines the point on which the progress calculation should be based.

```
<targetStart> <viewportStart> / <targetEnd> <viewportEnd>
```

The default value `start end / end start` could be read as: calculate the progress of the target from when the **start** of the target crosses the **end** of the viewport to when the **end** of the target crosses the **start** of the viewport.

Each point accepts the following values:

- A **number** between `0` and `1`
- A **named string**, either `start`, `end` or `center` which will be mapped to values between `0` and `1`
- A **string** representing a CSS value with one of the following unit: `%`, `px`, `vw`, `vh`, `vmin`, `vmax`

**Common offset patterns:**

| Offset | Description |
| ------ | ----------- |
| `"start end / end start"` | Default. Animation plays while element is visible in viewport |
| `"start center / end center"` | Animation plays while element crosses the center of viewport |
| `"start start / end start"` | Animation plays while element is at the top of viewport |
| `"start end / end end"` | Animation plays while element is at the bottom of viewport |
| `"start start / end end"` | Animation plays from when element enters until it completely leaves |

<!-- prettier-ignore-start -->
```html {2}
<div data-component="ScrollAnimationTimeline"
  data-option-offset="start center / end center">
  <div data-component="ScrollAnimationTarget" ...>
    Animates as element crosses viewport center
  </div>
</div>
```
<!-- prettier-ignore-end -->

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/offset/app.twig')"
  css=" "
  :css-editor="false"
  :script="() => import('./stories/offset/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/offset/app.twig
<<< ./stories/offset/app.js

:::

</llm-only>

### Children Components

#### `ScrollAnimationTarget`

- Type: `ScrollAnimationTarget[]`

Array of child animation targets that will be animated based on the scroll progress of the timeline.

---

## ScrollAnimationTarget

A component that animates based on scroll progress from a parent `ScrollAnimationTimeline`. Each target can have its own animation keyframes, play range, and damping settings.

### Usage

```html
<div data-component="ScrollAnimationTimeline">
  <div
    data-component="ScrollAnimationTarget"
    data-option-from='{"opacity": 0, "y": 100}'
    data-option-to='{"opacity": 1, "y": 0}'
    data-option-play-range="[0, 0.5]">
    First element
  </div>
  <div
    data-component="ScrollAnimationTarget"
    data-option-from='{"opacity": 0, "y": 100}'
    data-option-to='{"opacity": 1, "y": 0}'
    data-option-play-range="[0.5, 1]">
    Second element
  </div>
</div>
```

### Options

#### `playRange`

- Type: `[number, number] | [number, number, number]`
- Default: `[0, 1]`

Define the scroll progress range when the animation should play. Values between 0 and 1, where 0 is when the timeline enters the viewport and 1 is when it exits.

<!-- prettier-ignore-start -->
```html {4,11}
<div data-component="ScrollAnimationTimeline">
  <div
    data-component="ScrollAnimationTarget"
    data-option-play-range="[0, 0.5]">
    First (animates from 0% to 50% scroll)
  </div>
  <div
    data-component="ScrollAnimationTarget"
    data-option-play-range="[0.5, 1]">
    Second (animates from 50% to 100% scroll)
  </div>
</div>
```
<!-- prettier-ignore-end -->

##### Staggered animation

Staggered scroll animation can be created by giving 3 numbers to the `playRange` option:

- `index`: the current index of the items in the staggered list
- `length`: the length of the staggered items
- `step`: the delay to apply between each item in the staggered list

<!-- prettier-ignore-start -->
```html {4,10}
<div data-component="ScrollAnimationTimeline">
  <div
    data-component="ScrollAnimationTarget"
    data-option-play-range="[0, 2, 0.1]">
    ...
  </div>
  <div
    data-component="ScrollAnimationTarget"
    data-option-play-range="[1, 2, 0.1]">
    ...
  </div>
</div>
```
<!-- prettier-ignore-end -->

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

##### Sequentially ordered animation

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

#### `from`

- Type: `object`
- Default: `{}`

Initial keyframe for the animation. Define CSS properties as key-value pairs.

<!-- prettier-ignore-start -->
```html {4}
<div data-component="ScrollAnimationTimeline">
  <div
    data-component="ScrollAnimationTarget"
    data-option-from='{ "opacity": 0, "y": 100 }'>
    ...
  </div>
</div>
```
<!-- prettier-ignore-end -->

#### `to`

- Type: `object`
- Default: `{}`

Final keyframe for the animation. Define CSS properties as key-value pairs.

<!-- prettier-ignore-start -->
```html {4}
<div data-component="ScrollAnimationTimeline">
  <div
    data-component="ScrollAnimationTarget"
    data-option-to='{ "opacity": 1, "y": 0 }'>
    ...
  </div>
</div>
```
<!-- prettier-ignore-end -->

#### `keyframes`

- Type: `keyFrame[]`
- Default: `[]`

Array of keyframes for complex animations. When provided, `from` and `to` are ignored.

```html
<div data-component="ScrollAnimationTimeline">
  <div
    data-component="ScrollAnimationTarget"
    data-option-keyframes='[
      { "--opacity": 0, "scale": 0.8 },
      { "--opacity": 0.5, "scale": 1.1 },
      { "--opacity": 1, "scale": 1 }
    ]'
    style="opacity: var(--opacity, 0);">
    ...
  </div>
</div>
```

See the following types definitions and [the `animate` documentation](https://js-toolkit.studiometa.dev/utils/css/animate.html) for more advanced documentation on keyframes.

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

#### `easing`

- Type: `[number, number, number, number]`
- Default: `[0, 0, 1, 1]`

Cubic-bezier easing values for the animation timing.

<!-- prettier-ignore-start -->
```html {4}
<div data-component="ScrollAnimationTimeline">
  <div
    data-component="ScrollAnimationTarget"
    data-option-easing="[0.19, 1, 0.22, 1]">
    ...
  </div>
</div>
```
<!-- prettier-ignore-end -->

##### Common easing values

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

#### `dampFactor`

- Type: `number`
- Default: `0.1`

Damping factor for smooth scroll animations. Lower values create smoother, slower animations. Each `ScrollAnimationTarget` can have its own damping factor, allowing for different animation speeds within the same timeline.

```html {4,9}
<div data-component="ScrollAnimationTimeline">
  <div
    data-component="ScrollAnimationTarget"
    data-option-damp-factor="0.05"
    data-option-from='{"y": 100}'>
    Slow and smooth
  </div>
  <div
    data-component="ScrollAnimationTarget"
    data-option-damp-factor="0.5"
    data-option-from='{"y": 100}'>
    Fast and snappy
  </div>
</div>
```

#### `dampPrecision`

- Type: `number`
- Default: `0.001`

Precision threshold for damping calculations. Lower values increase precision but may impact performance.

### Methods

#### `render(progress)`

- Parameters:
  - `progress` (`number`): animation progress between 0 and 1
- Returns: `void`

Manually render the animation at a specific progress value.

### Properties

#### `target`

- Type: `HTMLElement`

The element being animated. Defaults to the component's root element (`$el`).

#### `animation`

- Type: `Animation`

The animation instance created from the keyframes and easing options. See [`animate` documentation](https://js-toolkit.studiometa.dev/utils/css/animate.html).

#### `dampedCurrent`

- Type: `{ x: number, y: number }`

Current damped scroll position values for both axes.

#### `dampedProgress`

- Type: `{ x: number, y: number }`

Current damped progress values (0-1) for both axes.

#### `playRange`

- Type: `[number, number]`

The computed play range for the animation, taking into account the staggered format if used.

---

## ScrollAnimation (deprecated) {#scrollanimation-deprecated}

:::warning Deprecated
The `ScrollAnimation` component is deprecated. Use `ScrollAnimationTimeline` with `ScrollAnimationTarget` children instead.
:::

A standalone component that watches its own position in the viewport and animates a target element. This component requires a `target` ref.

### Usage

```html
<div
  data-component="ScrollAnimation"
  data-option-from='{"opacity": 0, "y": 100}'
  data-option-to='{"opacity": 1, "y": 0}'>
  <div data-ref="target">Content to animate</div>
</div>
```

### Refs

#### `target`

- Type: `HTMLElement`

The element to animate. Required for this component.

### Options

The `ScrollAnimation` component supports the same options as `ScrollAnimationTarget`:

- [`playRange`](#playrange)
- [`from`](#from)
- [`to`](#to)
- [`keyframes`](#keyframes)
- [`easing`](#easing)

---

## withScrollAnimationDebug

A decorator that adds debug capabilities to `ScrollAnimationTimeline`. When the `debug` option is enabled, it displays visual markers to help understand how the scroll animation is triggered.

This decorator is exported separately to allow tree-shaking the debug code from production bundles.

### Usage

```js
import { Base, createApp } from '@studiometa/js-toolkit';
import {
  ScrollAnimationTimeline,
  ScrollAnimationTarget,
  withScrollAnimationDebug,
} from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      ScrollAnimationTimeline: withScrollAnimationDebug(ScrollAnimationTimeline),
      ScrollAnimationTarget,
    },
  };
}

export default createApp(App);
```

```html
<div data-component="ScrollAnimationTimeline" data-option-debug>
  <div data-component="ScrollAnimationTarget" ...>
    ...
  </div>
</div>
```

### Debug features

When the `debug` option is enabled on a `ScrollAnimationTimeline` component wrapped with this decorator:

- **Outline**: A dashed border around the timeline element
- **Start marker**: A horizontal line showing where in the viewport the animation starts
- **End marker**: A horizontal line showing where in the viewport the animation ends
- **Progress indicator**: A progress bar and percentage showing the current scroll progress

Each timeline gets a different color for easy identification when multiple timelines are on the same page.

### Parameters

- `BaseClass` (`typeof ScrollAnimationTimeline`): The `ScrollAnimationTimeline` class to decorate

### Return value

- `typeof ScrollAnimationTimeline`: The decorated class with debug capabilities
