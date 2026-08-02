---
title: ClickOutside examples
---

# Examples

## Expandable card

The simplest pairing: `ClickOutside` and `Action` share the same element and each effect toggles a single class. Clicking the card opens it, clicking anywhere outside collapses it. Because the trigger is the element itself, the opening click is always _inside_ and never fights the close.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/expandable-card/app.twig')"
    :script="() => import('./stories/expandable-card/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/expandable-card/app.twig
<<< ./stories/expandable-card/app.js

:::

</llm-only>

## Inline edit

A label turns into an input on click and commits back to a static label when a click lands outside. Keeping the input _inside_ the `ClickOutside` element is what makes this reliable — clicking the field never triggers the outside-click that would close the editor.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/inline-edit/app.twig')"
    :script="() => import('./stories/inline-edit/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/inline-edit/app.twig
<<< ./stories/inline-edit/app.js

:::

</llm-only>

::: tip Keep the trigger inside
`ClickOutside` reports every click that lands outside its root element. If the control that _opens_ a panel sits outside that element, the very click that opens it will also be seen as an outside click and immediately close it again. Nest the trigger inside the `ClickOutside` element — as in both examples above and the [dropdown on the overview page](./index.md) — to avoid this.
:::
