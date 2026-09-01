---
title: Tabs examples
---

# Examples

## Simple

The template renders the whole `tablist` / `tab` / `tabpanel` structure. `label` names the tab list, `list_attr` styles it, and the selected tab is the one CSS selects with `[aria-selected="true"]` — the component writes no inline style.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/basic/app.twig')"
  :script="() => import('./stories/basic/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/basic/app.twig
<<< ./stories/basic/app.js

:::

</llm-only>

## Transitioned panels

`Tabs` calls `enter()` and `leave()` on the [`Transition`](../Transition/index.md) and [`ViewTransition`](../ViewTransition/index.md) components inside each panel, and hides the closing panel only once its transitions have resolved. This replaces the `styles` option of v1.

This example also uses `data-option-activation="manual"`, so the arrow keys move the focus and <kbd>Enter</kbd> or <kbd>Space</kbd> switches the panel.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/transition/app.twig')"
  :script="() => import('./stories/transition/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/transition/app.twig
<<< ./stories/transition/app.js

:::

</llm-only>
