---
title: Modal examples
---

# Examples

## Simple

<PreviewIframe src="./stories/simple/story.html" />

:::details Code

<SimpleTabs :items="['app.twig', 'app.js']">
  <template #content-1>

<<< ./stories/simple/app.twig

  </template>
  <template #content-2>

<<< ./stories/simple/app.js

  </template>
</SimpleTabs>

:::

## With transition

<PreviewIframe src="./stories/transition/story.html" />

:::details Code

<SimpleTabs :items="['app.twig', 'app.js']">
  <template #content-1>

<<< ./stories/simple/app.twig

  </template>
  <template #content-2>

<<< ./stories/transition/app.js

  </template>
</SimpleTabs>

:::
