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
