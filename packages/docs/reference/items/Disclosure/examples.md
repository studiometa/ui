---
title: Disclosure examples
---

# Examples

## Single-open collapsible FAQ

This group allows at most one answer to be open, while allowing the open answer to collapse.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/basic/app.twig')"
  :script="() => import('./stories/basic/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/basic/app.twig
<<< ./stories/basic/app.js

:::

</llm-only>

## Transitioned panels

A disclosure automatically calls `enter()` and `leave()` on its own descendant [`Transition`](../Transition/index.md) and [`ViewTransition`](../ViewTransition/index.md) components. Transition calls are serialized, so a rapid opposing toggle waits for the pending toolkit transition promise and only the completion matching the current state can finalize visibility or emit its `after-*` event.

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

## Standalone disclosure

`DisclosureGroup` is optional. Register `Disclosure` alone and use the same trigger/panel anatomy when no relationship with sibling disclosures is needed.

```html
<section data-component="Disclosure">
  <h3><button type="button" data-ref="trigger">More details</button></h3>
  <div data-ref="panel" hidden>Standalone panel content.</div>
</section>
```

## Relationship to the DataScope accordion recipe

The low-level [DataScope accordion recipe](../DataScope/examples.md#accordion) demonstrates the principles behind a single-open collapsible interface: isolated state, one active value, and trigger/panel ARIA relationships. Use that recipe when you intentionally need to compose disclosure state from the generic Data components. Use `Disclosure` for the dedicated behavior, including focus restoration, disabled and non-collapsible constraints, dynamic registration, and transition orchestration.

Do not add `DataBind`, `DataModel`, or another Data component that binds `aria-expanded` or `hidden` to `Disclosure` markup. `Disclosure` owns those states, as well as temporary `inert` during closing transitions; competing bindings can leave accessibility state out of sync. Data components can still manage unrelated content or attributes.
