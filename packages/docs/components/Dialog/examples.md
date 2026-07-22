---
title: Dialog examples
---

# Examples

## Modal dialog

Click **Open dialog** to open a modal wired entirely with [`Action`](/components/Action/). The backdrop fades and the box scales in, each a [`Transition`](/components/Transition/) child the `Dialog` orchestrates. Close it with the button, the backdrop, or <kbd>Esc</kbd>.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/modal/app.twig')"
  :script="() => import('./stories/modal/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/modal/app.twig
<<< ./stories/modal/app.js

:::

</llm-only>

## Drawer

A drawer is just a `Dialog`. The panel is anchored to the right edge with plain classes (`absolute inset-y-0 right-0 w-80`) and slides in via an optional [`ViewTransition`](/components/ViewTransition/) child — smooth even in Firefox. Both the position and the slide direction are author-controlled; the library ships no drawer component. See [Building a drawer](./index.md#building-a-drawer).

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/drawer/app.twig')"
  :script="() => import('./stories/drawer/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/drawer/app.twig
<<< ./stories/drawer/app.js

:::

</llm-only>
