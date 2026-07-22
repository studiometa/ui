---
title: Action examples
---

# Examples

## Close several dialogs at once

A single `Action` can target several components at once. Here one button closes both a centered [`Dialog`](/components/Dialog/) and a drawer by targeting every `Dialog` matching the `[data-can-be-closed]` attribute selector.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/close-dialogs/app.twig')"
    :script="() => import('./stories/close-dialogs/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/close-dialogs/app.twig
<<< ./stories/close-dialogs/app.js

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

## Side effects on a popover

`Action` listens to real DOM events, so it can react to native ones too. Here a `<dialog>` uses the [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) for the whole modal mechanics — open, close, <kbd>Esc</kbd>, click-outside, focus and top-layer stacking — with no JavaScript. `Action` only wires the one thing the platform does not provide: locking the body scroll, by listening to the popover's `toggle` event and reading its `newState`.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/popover-toggle/app.twig')"
    :script="() => import('./stories/popover-toggle/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/popover-toggle/app.twig
<<< ./stories/popover-toggle/app.js

:::

</llm-only>
