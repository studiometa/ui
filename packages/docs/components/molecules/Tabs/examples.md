---
title: Tabs examples
---

# Examples

## Simple

<PreviewIframe src="./stories/story.html" />

:::details Code

<SimpleTabs :items="['app.twig', 'app.js']">
  <template #content-1>

<<< ./components/molecules/Tabs/stories/app.twig

  </template>
  <template #content-2>

<<< ./components/molecules/Tabs/stories/app.js

  </template>
</SimpleTabs>

:::
