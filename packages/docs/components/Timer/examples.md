---
title: Timer examples
---

# Examples

## Looping progress bar

`TimerProgress` emits a bubbling `timer-progress` event on every animation frame. A single routing [`Action`](/components/Action/) on an ancestor catches it and forwards the ratio to a [`DataBind`](/components/DataBind/) that lives in a separate subtree — so the progress bar and the timer never need to share an element. Hovering the label pauses the countdown, and the bar freezes with it.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/progress/app.twig')"
    :script="() => import('./stories/progress/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/progress/app.twig
<<< ./stories/progress/app.js

:::

</llm-only>
