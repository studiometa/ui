---
title: Sheet examples
---

# Examples

## Bottom sheet

Click the Open sheet button, then swipe the sheet down — or scroll down with a wheel or a trackpad — to dismiss it. The backdrop opacity and the corner radius follow the gesture through the `--sheet` view timeline, with the `--sheet-progress` fallback where view timelines are not supported. The close button, the backdrop and <kbd>Esc</kbd> close it too. See [the required CSS](./index.md#the-required-css).

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/bottom/app.twig')"
  :script="() => import('./stories/bottom/app.js?raw')"
  :css="() => import('./stories/bottom/app.css?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/bottom/app.twig
<<< ./stories/bottom/app.js
<<< ./stories/bottom/app.css

:::

</llm-only>
