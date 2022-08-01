---
title: ScrollAnimation examples
---

# Examples

## Simple animation

<PreviewIframe src="./stories/simple/story.html" />

:::details Code

<SimpleTabs :items="['app.twig', 'app.js']">
  <template #content-1>

<<< ./components/atoms/ScrollAnimation/stories/simple/app.twig

  </template>
  <template #content-2>

<<< ./components/atoms/ScrollAnimation/stories/simple/app.js

  </template>
</SimpleTabs>

:::

## Parent driven animation

<PreviewIframe src="./stories/parent/story.html" />

:::details Code

<SimpleTabs :items="['app.twig', 'app.js', 'ScrollAnimationParent.js']">
  <template #content-1>

<<< ./components/atoms/ScrollAnimation/stories/parent/app.twig

  </template>
  <template #content-2>

<<< ./components/atoms/ScrollAnimation/stories/parent/app.js

  </template>
  <template #content-3>

<<< ./components/atoms/ScrollAnimation/stories/parent/ScrollAnimationParent.js

  </template>
</SimpleTabs>

:::

## Parallax

You can easily implement a parallax effect with images by combining the `ScrollAnimation` class with the [Figure component](/components/atoms/Figure/).

Here, we even use the [ImageGrid organism](/components/organisms/ImageGrid/) to quickly have a nice listing layout. We are able to configure it to wrap each image in a `Parallax` component.

<PreviewIframe src="./stories/parallax/story.html" />

:::details Code

<SimpleTabs :items="['app.twig', 'app.js', 'Parallax.js']">
  <template #content-1>

<<< ./components/atoms/ScrollAnimation/stories/parallax/app.twig

  </template>
  <template #content-2>

<<< ./components/atoms/ScrollAnimation/stories/parallax/app.js

  </template>
  <template #content-3>

<<< ./components/atoms/ScrollAnimation/stories/parallax/Parallax.js

  </template>
</SimpleTabs>

:::

## Parallax with a parent

It might be sometimes interesting to use the parent ↔ child logic of the `ScrollAnimation` component to improve performance, as only the parent progression in the viewport is watched.

The resulting effect is different as each child animation is driven by the parent one, but it is still interesting.

<PreviewIframe src="./stories/parallax-parent/story.html" />

:::details Code

<SimpleTabs :items="['app.twig', 'app.js', 'ParallaxChild.js', 'ParallaxParent.js']">
  <template #content-1>

<<< ./components/atoms/ScrollAnimation/stories/parallax-parent/app.twig

  </template>
  <template #content-2>

<<< ./components/atoms/ScrollAnimation/stories/parallax-parent/app.js

  </template>
  <template #content-3>

<<< ./components/atoms/ScrollAnimation/stories/parallax-parent/ParallaxChild.js

  </template>
  <template #content-4>

<<< ./components/atoms/ScrollAnimation/stories/parallax-parent/ParallaxParent.js

  </template>
</SimpleTabs>

:::
