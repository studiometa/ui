---
title: Popover examples
---

# Examples

## Dropdown menu

Click the button to toggle a dropdown wired entirely with [`Action`](/components/Action/). The panel is a [`Transition`](/components/Transition/) child the `Popover` orchestrates; it closes on <kbd>Esc</kbd> and when an item is chosen. Positioning is native CSS anchor positioning.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/menu/app.twig')"
  :script="() => import('./stories/menu/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/menu/app.twig
<<< ./stories/menu/app.js

:::

</llm-only>

## Tooltip

The same primitive, opened on hover and focus instead of click. `open()`/`close()` are called from the trigger's pointer and focus events, with a short fade as the [`Transition`](/components/Transition/).

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/tooltip/app.twig')"
  :script="() => import('./stories/tooltip/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/tooltip/app.twig
<<< ./stories/tooltip/app.js

:::

</llm-only>
