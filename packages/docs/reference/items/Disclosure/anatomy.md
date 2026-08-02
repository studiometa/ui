---
title: Disclosure anatomy
---

# Anatomy

Each `Disclosure` owns one trigger and one panel. A `DisclosureGroup` is optional and coordinates only the constraints between independently mounted disclosures.

## Structure

```
DisclosureGroup (optional)             data-component="DisclosureGroup"
└─ Disclosure (× n)                    data-component="Disclosure"
   ├─ heading                          h2–h6 appropriate to the page outline
   │  └─ trigger                       button[data-ref="trigger"]
   └─ panel                            [data-ref="panel"]
```

## Parts

| Part       | Selector                           | Required                          | Role                                                                                         |
| ---------- | ---------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------- |
| Group      | `data-component="DisclosureGroup"` | No                                | Coordinates multiple/collapsible constraints for its closest registered disclosure children. |
| Disclosure | `data-component="Disclosure"`      | Yes                               | Owns state, accessibility attributes, focus handling, and local transitions.                 |
| Heading    | Native heading element             | Required for an accordion pattern | Gives each disclosure trigger an appropriate place in the document outline.                  |
| Trigger    | `button[data-ref="trigger"]`       | Yes                               | Toggles the panel and exposes `aria-expanded` and `aria-controls`.                           |
| Panel      | `[data-ref="panel"]`               | Yes                               | Contains the disclosed content and is labelled by the trigger.                               |

Use a native `<button type="button">`; `Disclosure` warns when the trigger ref is not an `HTMLButtonElement`. For an accordion, wrap each button in a native heading whose level fits the page hierarchy. The JavaScript component does not create or validate that heading. The Twig template defaults to `<h3>` and lets you choose `heading_tag`.

The panel does not receive a `region` role automatically. Add `role="region"` only when the extra landmark helps users; avoid creating a large number of unnecessary regions.

## IDs and ARIA

Authored trigger and panel IDs are preserved. If either ID is missing, `Disclosure` generates it from the component instance ID, then always sets the trigger's `aria-controls` to the panel ID and the panel's `aria-labelledby` to the trigger ID. The Twig template renders deterministic IDs from the required group `id` and each item's explicit `id`, or from its one-based position when no item ID is provided.

`aria-expanded` follows the current state. Closed panels use the native `hidden` property rather than `aria-hidden`. On close, focus inside the panel returns to the trigger, the panel becomes `inert` while leave transitions run, and it becomes `hidden` when they finish; `inert` is then removed. On open, `hidden` and `inert` are removed before enter transitions run.

## Nesting and dynamic children

A disclosure registers with its closest mounted `DisclosureGroup`. Children and groups may mount in either order; dynamically mounted children register themselves, removed children unregister, and a mounted disclosure reconnects when it is moved in the DOM. If a nearer nested group mounts later, the disclosure migrates to it. Public `items` and `openItems` are always returned in current DOM order.

Transitions belonging to a nested disclosure are not orchestrated by an outer disclosure.
