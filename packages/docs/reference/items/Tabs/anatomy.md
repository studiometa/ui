---
title: Tabs anatomy
---

# Anatomy

`Tabs` is a single JavaScript component driving a structured piece of markup. It pairs each tab button with its panel through matching `data-ref` collections. Use this map to see which parts exist and how they nest.

## Structure

```
Tabs                                   data-component="Tabs"
├─ btn      [data-ref="btn"]      (× n)   a tab button
└─ content  [data-ref="content"]  (× n)   the matching panel
```

## Parts

| Part | Selector | Required | Role |
| --- | --- | --- | --- |
| Root | `data-component="Tabs"` | Yes | Owns the active index, toggles panels and handles keyboard navigation. |
| Button | `data-ref="btn"` | Yes (× n) | A tab trigger. Paired with the panel at the same position. |
| Panel | `data-ref="content"` | Yes (× n) | The panel shown when its button is active. Transitions between states. |

The button and panel at the same index are paired together, so the `btn` and `content` refs must appear in matching order.

The [`Tabs.twig`](./twig-api.md) template renders this structure for you from an `items` array. See the [Twig API](./twig-api.md) for parameters and the [JavaScript API](./js-api.md) for options.
