---
title: MotionView examples
---

# Examples

## Animated state change

[`MotionView`](./js-api) wraps DOM updates in Motion's `animateView()`, as a drop-in alternative to [`ViewTransition`](/reference/items/ViewTransition/): toggling swaps the `enterTo`/`leaveTo` classes inside a view transition, and the spring `transition` with the `layout` morph animates the card between its two states — no `::view-transition-*` CSS needed. Where view transitions are unavailable, the classes still swap, only without animation.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/view/app.twig')"
    :script="() => import('./stories/view/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/view/app.twig
<<< ./stories/view/app.js

:::

</llm-only>

## Zero-wiring exit animation for `data-bind:if`

[Ambient wiring](./js-api#ambient-wiring) in action: the `MotionView` has no wiring attribute at all — it wraps the `dom-update` event that [`data-bind:if`](/reference/items/DataBind/js-api#conditional-rendering-with-data-bind-if) announces before changing the DOM, so the template content animates in **and out**, even though the removed nodes are already gone when the exit plays. The `layout` option morphs the container's size with a spring.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/ambient-bind-if/app.twig')"
    :script="() => import('./stories/ambient-bind-if/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/ambient-bind-if/app.twig
<<< ./stories/ambient-bind-if/app.js

:::

</llm-only>

## Ambient view transitions in a `Dialog`

The same containment story with [`Dialog`](/reference/items/Dialog/): nested inside it, the `MotionView` joins the bubbling `open`/`close` lifecycle by itself — the dialog calls its `enter()`/`leave()` through `waitUntil()` and stays painted until the spring view transition settles. Compare with the [explicit `Motion` wiring](/reference/items/Motion/examples#spring-entrance-and-exit-for-a-dialog): same result, zero attributes.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/ambient-dialog/app.twig')"
    :script="() => import('./stories/ambient-dialog/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/ambient-dialog/app.twig
<<< ./stories/ambient-dialog/app.js

:::

</llm-only>
