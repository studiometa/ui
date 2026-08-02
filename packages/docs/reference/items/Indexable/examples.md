---
title: Indexable examples
---

# Examples

## Counter

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/counter/app.twig')"
  :script="() => import('./stories/counter/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/counter/app.twig
<<< ./stories/counter/app.js

:::

</llm-only>

## Slider

This example builds a slider without a dedicated component. `Indexable` owns the index — `total` sets the number of slides and `boundary="loop"` wraps around — while [`Action`](../Action/index.md) triggers `goPrev()`, `goNext()` and `goTo()`. A co-located `Action` bridges the reactive rendering: because [`$emit`](https://js-toolkit.studiometa.dev/api/instance-methods/#emit) dispatches a native event, `data-on:index` catches the `index` event and forwards `event.detail[0]` to every [`DataBind`](../DataBind/index.md) and [`DataComputed`](../DataComputed/index.md), which move the track, highlight the dots and update the counter. No `Slider` component is registered.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/slider/app.twig')"
  :script="() => import('./stories/slider/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/slider/app.twig
<<< ./stories/slider/app.js

:::

</llm-only>
