---
title: ViewTransition examples
---

# Examples

## Togglable

Click the Enter and Leave buttons to toggle the element. The animation runs as a native view transition, defined entirely in the `::view-transition-old()` / `::view-transition-new()` CSS. In a browser without the View Transitions API, the element toggles instantly.

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

## Triggering with the `Action` component

`ViewTransition` exposes the same `enter()`, `leave()` and `toggle()` methods as [`Transition`](/components/Transition/), so the [`Action` component](/components/Action/) can drive it declaratively. No custom `onClick` handlers are required. Here the buttons target the `Togglable` instance and call its methods directly through `data-option-effect`.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/action/app.twig')"
  :script="() => import('./stories/action/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/action/app.twig
<<< ./stories/action/app.js

:::

</llm-only>
