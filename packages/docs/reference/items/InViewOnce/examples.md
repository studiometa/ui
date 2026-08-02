---
title: InViewOnce examples
---

# Examples

Like [`InView`](../InView/examples.md), `InViewOnce` emits its event as a native `CustomEvent` on the component's root element, so the [`Action` component](../Action/index.md) can react to it with a `data-on:in-view` attribute, with no custom JavaScript class. The difference is that `InViewOnce` fires once and never emits `out-of-view`.

## One-shot reveal

Each card carries both `Action` and `InViewOnce`. The first time it enters the viewport, `InViewOnce` emits `in-view`, the `Action` adds the `is-visible` class, and the component terminates. Scrolling the card out and back in does not replay the reveal, and no `out-of-view` event is ever emitted, which makes it a good fit for one-off reveals, lazy loading or analytics impressions.

This story also sets a custom [`intersectionObserver` option](./js-api.md#intersectionobserver) (`rootMargin: "-10% 0px"`) so the reveal only triggers once the card is comfortably inside the viewport.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/reveal/app.twig')"
  :script="() => import('./stories/reveal/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/reveal/app.twig
<<< ./stories/reveal/app.js

:::

</llm-only>

::: tip
Need the reveal to replay on every crossing, or a matching `out-of-view` reaction? Use the [`InView` primitive](../InView/index.md) instead; it is the repeating, directional counterpart.
:::
