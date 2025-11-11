---
title: Transition examples
---

# Examples

## Togglable

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/toggle/app.twig')"
  :script="() => import('./stories/toggle/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/toggle/app.twig
<<< ./stories/toggle/app.js

:::

</llm-only>

## Group

Use the [`group` option](/components/Transition/js-api.md#group) to keep multiple instances in sync. In the example below, the buttons only control the first component, the second one is synced with the `data-option-group` attribute.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/group/app.twig')"
  :script="() => import('./stories/group/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/group/app.twig
<<< ./stories/group/app.js

:::

</llm-only>
