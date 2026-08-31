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

[Ambient wiring](./js-api#ambient-wiring) in action: the `MotionView` has no wiring attribute at all — it wraps the `dom-update` event that [`data-bind:if`](/reference/items/DataBind/js-api#conditional-rendering-with-data-bind-if) announces before changing the DOM, so the template content animates in **and out**, even though the removed nodes are already gone when the exit plays. The `layout` option morphs the container's size with a spring. Because the event bubbles, the `MotionView` only needs to sit just outside the `<template>` instead of around the whole widget: the morph then hugs the panel region alone and leaves the checkbox above it out of the transition.

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

The same containment story with [`Dialog`](/reference/items/Dialog/): nested inside it, a `MotionView` listens for an extendable `open`/`close` lifecycle by itself, with no wiring attribute at all. Two instances share it here, the backdrop fading and the box springing in, because the extension is additive: every transitioner that registers on the event is awaited, so any number of them can animate one host without ever knowing about each other.

::: warning Not wired to `Dialog` in v2
`Dialog` emits `open` and `close` with no payload in v2, so the ambient wiring below never fires and the example does not animate. See [ambient wiring](./js-api#ambient-wiring). The [explicit `Motion` wiring](/reference/items/Motion/examples#spring-entrance-and-exit-for-a-dialog) is the pattern that works today.
:::

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
