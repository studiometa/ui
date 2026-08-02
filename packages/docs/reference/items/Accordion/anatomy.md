---
title: Accordion anatomy
---

# Anatomy

`Accordion` is a compound component: a root orchestrates one or more `AccordionItem` children, each wiring its parts through `data-ref` attributes. Use this map to see which parts exist and how they nest.

## Structure

```
Accordion                                data-component="Accordion"
└─ AccordionItem  (× n)                  data-component="AccordionItem"
   ├─ button      [data-ref="btn"]       the toggle, controls the panel
   └─ container   [data-ref="container"] the collapsible wrapper
      └─ content  [data-ref="content"]   the panel content
```

## Parts

| Part | Selector | Required | Role |
| --- | --- | --- | --- |
| Root | `data-component="Accordion"` | Yes | Groups the items, handles `autoclose`, forwards the shared `item` options. |
| Item | `data-component="AccordionItem"` | Yes (× n) | A single expandable section. Holds the `isOpen` and `styles` options. |
| Trigger | `data-ref="btn"` | Yes | The `<button>` that toggles its item. `aria-controls` / `aria-expanded` are set automatically. |
| Container | `data-ref="container"` | Yes | The animated wrapper whose height transitions between open and closed. |
| Content | `data-ref="content"` | Yes | The revealed content. `aria-hidden` / `aria-labelledby` are set automatically. |

The [`Accordion.twig`](./twig-api.md) template renders this structure for you from an `items` array. See the [Twig API](./twig-api.md) for parameters and blocks.
