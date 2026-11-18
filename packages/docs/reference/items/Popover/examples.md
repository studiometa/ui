---
title: Popover examples
---

# Examples

## Dropdown

Click the Account button to toggle a dropdown wired with [`Action`](/reference/items/Action/). The panel is a [`Transition`](/reference/items/Transition/) child the `Popover` orchestrates. <kbd>Esc</kbd> closes it and moves the focus back to the button, and so does a click outside, through [`ClickOutside`](/reference/items/ClickOutside/). The `open` and `close` events keep `aria-expanded` in sync on the button. The panel is placed with native CSS anchor positioning.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/dropdown/app.twig')"
  :script="() => import('./stories/dropdown/app.js?raw')"
  :css="() => import('./stories/dropdown/app.css?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/dropdown/app.twig
<<< ./stories/dropdown/app.js
<<< ./stories/dropdown/app.css

:::

</llm-only>

## Tooltip

The same component, opened on hover and focus instead of click. <kbd>Esc</kbd> closes it while the button has the focus. The pointer can move onto the tooltip: an `open()` during the leave transition keeps it shown.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/tooltip/app.twig')"
  :script="() => import('./stories/tooltip/app.js?raw')"
  :css="() => import('./stories/tooltip/app.css?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/tooltip/app.twig
<<< ./stories/tooltip/app.js
<<< ./stories/tooltip/app.css

:::

</llm-only>
