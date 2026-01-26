---
title: ScrollAnimation examples
---

# Examples

## From / To

Use the `from` and `to` options to define the start and end states of the animation.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/from-to/app.twig')"
  css=" "
  :css-editor="false"
  :script="() => import('./stories/from-to/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/from-to/app.twig
<<< ./stories/from-to/app.js

:::

</llm-only>

## Keyframes

Use the `keyframes` option to define multiple animation steps. Each keyframe can have an optional `offset` (0-1) to control when it occurs and an `easing` to control the interpolation to the next keyframe.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/keyframes/app.twig')"
  css=" "
  :css-editor="false"
  :script="() => import('./stories/keyframes/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/keyframes/app.twig
<<< ./stories/keyframes/app.js

:::

</llm-only>

## Play range

Use the `playRange` option to control when the animation starts and ends relative to the scroll progress. The value is an array of two numbers between 0 and 1.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/play-range/app.twig')"
  css=" "
  :css-editor="false"
  :script="() => import('./stories/play-range/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/play-range/app.twig
<<< ./stories/play-range/app.js

:::

</llm-only>

## Easing

Use the `easing` option to control the animation curve. The value is a cubic-bezier array `[x1, y1, x2, y2]`.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/easing/app.twig')"
  css=" "
  :css-editor="false"
  :script="() => import('./stories/easing/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/easing/app.twig
<<< ./stories/easing/app.js

:::

</llm-only>

## Damp factor

Use the `dampFactor` option to add smoothing to the animation. Lower values create smoother, slower animations. The default value is `0.1`.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/damp-factor/app.twig')"
  css=" "
  :css-editor="false"
  :script="() => import('./stories/damp-factor/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/damp-factor/app.twig
<<< ./stories/damp-factor/app.js

:::

</llm-only>

## Debug

Use the `withScrollAnimationDebug` decorator and the `debug` option to display visual markers showing the start/end positions and current progress. This is useful during development to understand how the scroll animation is triggered. The decorator allows the debug code to be tree-shaken from production bundles.

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

## Offset

Use the `offset` option on `ScrollAnimationTimeline` to control when the animation starts and ends relative to the viewport.

The offset format is `"<targetStart> <viewportStart> / <targetEnd> <viewportEnd>"` where:
- `targetStart` / `targetEnd`: position on the timeline element (`start` = top, `center` = middle, `end` = bottom)
- `viewportStart` / `viewportEnd`: position on the viewport (`start` = top, `center` = middle, `end` = bottom)

You can use named values (`start`, `center`, `end`), numbers between 0 and 1, or percentages.

### Default offset

**Value:** `"start end / end start"` (default)

The animation **starts** when the **start (top) of the timeline** reaches the **end (bottom) of the viewport**.
The animation **ends** when the **end (bottom) of the timeline** reaches the **start (top) of the viewport**.

This means the animation plays while any part of the timeline is visible in the viewport.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/offset-default/app.twig')"
  css=" "
  :css-editor="false"
  :script="() => import('./stories/offset-default/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/offset-default/app.twig
<<< ./stories/offset-default/app.js

:::

</llm-only>

### Centered offset

**Value:** `"start center / end center"`

The animation **starts** when the **start (top) of the timeline** reaches the **center of the viewport**.
The animation **ends** when the **end (bottom) of the timeline** reaches the **center of the viewport**.

This means the animation plays while the timeline crosses the middle of the screen.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/offset-center/app.twig')"
  css=" "
  :css-editor="false"
  :script="() => import('./stories/offset-center/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/offset-center/app.twig
<<< ./stories/offset-center/app.js

:::

</llm-only>

### Top section offset

**Value:** `"start start / end start"`

The animation **starts** when the **start (top) of the timeline** reaches the **start (top) of the viewport**.
The animation **ends** when the **end (bottom) of the timeline** reaches the **start (top) of the viewport**.

This means the animation plays while the timeline is pinned at the top of the viewport.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/offset-top/app.twig')"
  css=" "
  :css-editor="false"
  :script="() => import('./stories/offset-top/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/offset-top/app.twig
<<< ./stories/offset-top/app.js

:::

</llm-only>

### Numbered offset

**Value:** `"0 0.8 / 1 0.2"`

The animation **starts** when the **start (0 = top) of the timeline** reaches **80% (0.8) from the top of the viewport**.
The animation **ends** when the **end (1 = bottom) of the timeline** reaches **20% (0.2) from the top of the viewport**.

Using numbers between 0 and 1 gives you precise control over the trigger positions.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/offset-numbered/app.twig')"
  css=" "
  :css-editor="false"
  :script="() => import('./stories/offset-numbered/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/offset-numbered/app.twig
<<< ./stories/offset-numbered/app.js

:::

</llm-only>

### Percentage offset

**Value:** `"0 75% / 100% 25%"`

The animation **starts** when the **start (0 = top) of the timeline** reaches **75% from the top of the viewport**.
The animation **ends** when the **end (100% = bottom) of the timeline** reaches **25% from the top of the viewport**.

Percentages work the same as numbers but can be more readable.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/offset-percentage/app.twig')"
  css=" "
  :css-editor="false"
  :script="() => import('./stories/offset-percentage/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/offset-percentage/app.twig
<<< ./stories/offset-percentage/app.js

:::

</llm-only>

## Cards

Animate multiple elements within a single timeline.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/cards/app.twig')"
  css=" "
  :css-editor="false"
  :script="() => import('./stories/cards/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/cards/app.twig
<<< ./stories/cards/app.js

:::

</llm-only>

## Text

Animate text characters individually.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/text/app.twig')"
  css=" "
  :css-editor="false"
  :script="() => import('./stories/text/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/text/app.twig
<<< ./stories/text/app.js

:::

</llm-only>

## Sticky animation

Use the `sticky` CSS property to create a sticky element that animates as you scroll.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/sticky/app.twig')"
  css=" "
  :css-editor="false"
  :script="() => import('./stories/sticky/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/sticky/app.twig
<<< ./stories/sticky/app.js

:::

</llm-only>

## Staggered animation

Use the `playRange` option with a value following the pattern `[index, length, step]` to add a staggered effect on multiple components.

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

## Sequentially played animation

Like the [staggered animation](#staggered-animation), use the pattern `[index, length, step]` for the `playRange` option, but set the `step` value to be `1 / length` to make each animation in the staggered list play one after another.

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

## Parallax

You can easily implement a parallax effect with images by combining the `ScrollAnimationTarget` class with the [Figure component](/components/Figure/).

Here, we even use the [ImageGrid organism](/components/ImageGrid/) to quickly have a nice listing layout. We are able to configure it to wrap each image in a `Parallax` component.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/parallax/app.twig')"
  :script="() => import('./stories/parallax/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/parallax/app.twig
<<< ./stories/parallax/app.js

:::

</llm-only>
