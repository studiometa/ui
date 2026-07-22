---
title: ViewTransition examples
---

# Examples

## Togglable

Click **Enter** and **Leave** to toggle the element. The animation runs as a native view transition, defined entirely in the `::view-transition-old()` / `::view-transition-new()` CSS. In a browser without the View Transitions API, the element toggles instantly.

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
