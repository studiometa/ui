---
title: Toaster examples
---

# Examples

## Basic toaster

Click a button to push a toast. Info and success toasts go to the polite region, errors to the assertive one, and each auto-dismisses after five seconds — hover or focus a toast to pause its timer. Fire **Stack 3** to see a burst coalesce into a single coordinated transition, then dismiss one in the middle: the survivors slide to their new slots without shimmying.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/basic/app.twig')"
  :script="() => import('./stories/basic/app.js?raw')"
  :css="() => import('./stories/basic/app.css?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/basic/app.twig
<<< ./stories/basic/app.js
<<< ./stories/basic/app.css

:::

</llm-only>

## Positions

A toaster's corner is nothing more than the region's flex alignment: `justify-start` / `justify-end` picks the top or bottom edge and the region's `items-start` / `items-end` the left or right one. Here four identical toasters are anchored to the four corners — click any button to pop a toast in that corner.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/positions/app.twig')"
  :script="() => import('./stories/positions/app.js?raw')"
  :css="() => import('./stories/positions/app.css?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/positions/app.twig
<<< ./stories/positions/app.js
<<< ./stories/positions/app.css

:::

</llm-only>
