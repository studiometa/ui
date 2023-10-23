---
title: Frame examples
---

# Examples

## Simple

<PreviewIframe src="./stories/story-a.html" />

:::details Code

<SimpleTabs :items="['page-a.html', 'page-b.html', 'app.js']">
  <template #content-1>

<<< ./stories/a-src.html

  </template>
  <template #content-2>

<<< ./stories/b-src.html

  </template>
  <template #content-3>

<<< ./stories/app-src.js

  </template>
</SimpleTabs>

:::
