---
title: Action examples
---

# Examples

## Close modals and panels

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/close-modal-and-panel/app.twig')"
    :script="() => import('./stories/close-modal-and-panel/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/close-modal-and-panel/app.twig
<<< ./stories/close-modal-and-panel/app.js

:::

</llm-only>

## Prevent default

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/prevent-default/app.twig')"
    :script="() => import('./stories/prevent-default/app.js?raw')"
    />
</llm-exclude>

<llm-only>

:::code-group

<<< ./stories/prevent-default/app.twig
<<< ./stories/prevent-default/app.js

:::

</llm-only>

## Debounce modifier

Use the `debounce` modifier to prevent firing the action's effect too often.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/debounce/app.twig')"
    :script="() => import('./stories/debounce/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/debounce/app.twig
<<< ./stories/debounce/app.js

:::

</llm-only>
