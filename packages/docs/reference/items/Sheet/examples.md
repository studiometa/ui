---
title: Sheet examples
---

# Examples

## Bottom sheet

Click the Open sheet button, then swipe the sheet down to dismiss it: drag it down on a touch screen, scroll up with a mouse wheel, or swipe down with two fingers on a trackpad. The backdrop opacity and the corner radius follow the gesture through the `--sheet` view timeline, with the `--sheet-progress` fallback where view timelines are not supported. The close button, the backdrop and <kbd>Esc</kbd> close it too. See [the required CSS](./index.md#the-required-css).

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

## Long content

When the content is taller than the screen, the panel scrolls it. Scroll the content down, then drag it back up: once the content reaches its top, the drag chains to the sheet and dismisses it. This story uses the same CSS and JavaScript as the bottom sheet.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/long-content/app.twig')"
  :script="() => import('./stories/bottom/app.js?raw')"
  :css="() => import('./stories/bottom/app.css?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/long-content/app.twig
<<< ./stories/bottom/app.js
<<< ./stories/bottom/app.css

:::

</llm-only>
