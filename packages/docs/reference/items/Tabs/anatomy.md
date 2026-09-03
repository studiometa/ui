---
title: Tabs anatomy
---

# Anatomy

`Tabs` is a single JavaScript component driving a structured piece of markup. It pairs each tab button with its panel through matching `data-ref` collections. Use this map to see which parts exist and how they nest.

## Structure

```
Tabs                                   data-component="Tabs"
├─ list     [data-ref="list"]              role="tablist"
│  └─ btn   [data-ref="btn"]      (× n)    role="tab"
└─ content  [data-ref="content"]  (× n)    role="tabpanel"
```

## Parts

| Part   | Selector                | Required  | Role                                                                               |
| ------ | ----------------------- | --------- | ---------------------------------------------------------------------------------- |
| Root   | `data-component="Tabs"` | Yes       | Owns the selected index, toggles panels and handles keyboard navigation.           |
| List   | `data-ref="list"`       | Yes       | Wraps the tab buttons and carries `role="tablist"` and the list's accessible name. |
| Button | `data-ref="btn"`        | Yes (× n) | A tab trigger. Paired with the panel at the same position.                         |
| Panel  | `data-ref="content"`    | Yes (× n) | The panel shown when its button is selected.                                       |

The button and panel at the same index are paired together, so the `btn` and `content` refs must appear in matching order.

The tab buttons must be direct content of the `list` element: an extra wrapper between the `tablist` and its `tab` children separates the tabs from the list that owns them. Put presentation on the list itself.

The [`Tabs.twig`](./twig-api.md) template renders this structure for you from an `items` array. See the [Twig API](./twig-api.md) for parameters and the [JavaScript API](./js-api.md) for options.
