---
title: InView examples
---

# Examples

Because [`$emit`](https://js-toolkit.studiometa.dev/api/methods/emit.html) dispatches a native `CustomEvent` on the component's root element, the [`Action` component](../Action/index.md) can catch the `in-view` and `out-of-view` events emitted by `InView` with its [`data-on:<event>` attributes](../Action/js-api.md#on-event-modifier). Putting both components on the same element (`data-component="Action InView"`) is therefore all it takes to react to viewport crossings declaratively — no custom JavaScript class required.

## Reveal on scroll

Each card carries both `Action` and `InView`. When it enters the viewport, `InView` emits `in-view` and the `Action` adds the `is-visible` class; when it leaves, `out-of-view` removes it again. Because `InView` re-fires on every crossing, the reveal replays each time you scroll a card back into view. The animation itself is plain CSS driven by the `is-visible` class.

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

## Playing a Transition on scroll

For a more capable reveal, share the element with the [`Transition` component](../Transition/index.md) and let the `Action` drive it: `in-view` plays `Transition.enter()` and `out-of-view` plays `Transition.leave()`. The enter/leave states are described with the usual `data-option-enter-*` / `data-option-leave-*` attributes, and `data-option-enter-keep` / `data-option-leave-keep` hold the final state between crossings.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/transition/app.twig')"
  :script="() => import('./stories/transition/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/transition/app.twig
<<< ./stories/transition/app.js

:::

</llm-only>

::: tip
The `Action` component can also target a **sibling** component instead of one mounted on the same element, using its [`Name(#selector) -> target.method()` syntax](../Action/js-api.md#on-event-modifier). For example, `data-on:in-view="Transition(#panel) -> target.enter()"` lets an `InView` element play the `enter()` method of the `Transition` with the `panel` id.
:::

## Custom threshold and root margin

The [`intersectionObserver` option](./js-api.md#intersectionobserver) is forwarded to the underlying `IntersectionObserver`, so you can tune when the crossing is detected. A negative `rootMargin` delays `in-view` until the element is comfortably inside the viewport:

```html
<div
  data-component="Action InView"
  data-option-intersection-observer='{ "rootMargin": "-15% 0px" }'
  data-on:in-view="$el.classList.add('is-visible')">
  …
</div>
```
