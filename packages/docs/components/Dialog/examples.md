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
