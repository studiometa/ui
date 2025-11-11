---
title: ScrollAnimation examples
---

# Examples

## Simple animation

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/simple/app.twig')"
  css=" "
  :css-editor="false"
  :script="() => import('./stories/simple/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/simple/app.twig
<<< ./stories/simple/app.js

:::

</llm-only>

## Parent driven animation

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/parent/app.twig')"
  css=" "
  :css-editor="false"
  :script="() => import('./stories/parent/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/parent/app.twig
<<< ./stories/parent/app.js

:::

</llm-only>

## Staggered animation

Use the `data-option-play-range` attribute with a value following the pattern `[index, length, step]` to add a staggered effect on multiple components.

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

Like the [staggered animation](#staggered-animation), use the pattern `[index, length, step]` for the `data-option-play-range` attribute, but set the `step` value to be `1 / length` to make each animation in the staggered list play one after another.

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

You can easily implement a parallax effect with images by combining the `ScrollAnimation` class with the [Figure component](/components/Figure/).

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

## Parallax with a parent

It might be sometimes interesting to use the parent ↔ child logic of the `ScrollAnimation` component to improve performance, as only the parent progression in the viewport is watched.

The resulting effect is different as each child animation is driven by the parent one, but it is still interesting.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/parallax-parent/app.twig')"
  :script="() => import('./stories/parallax-parent/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/parallax-parent/app.twig
<<< ./stories/parallax-parent/app.js

:::

</llm-only>
