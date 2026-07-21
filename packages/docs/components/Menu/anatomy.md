---
title: Menu anatomy
---

# Anatomy

`Menu` is a compound component built from a trigger and a list. A menu can also nest other menus to build multi-level navigation. Use this map to see which parts exist and how they nest.

## Structure

```
Menu                     data-component="Menu"
├─ MenuBtn               data-component="MenuBtn"    the trigger  (exactly one direct child)
└─ MenuList              data-component="MenuList"   the panel    (exactly one direct child)
   └─ Menu  (× n)        nested submenus                          (optional)
```

## Parts

| Part | Selector | Required | Role |
| --- | --- | --- | --- |
| Root | `data-component="Menu"` | Yes | Wires the button to the list, handles the `click` / `hover` mode, keyboard and click-outside. |
| Button | `data-component="MenuBtn"` | Yes | The trigger. `aria-controls` is set automatically. |
| List | `data-component="MenuList"` | Yes | The collapsible panel. Extends [`Transition`](../Transition/), manages focus and `aria-hidden`. |
| Submenu | `data-component="Menu"` | Optional | A `Menu` nested inside a `MenuList` for multi-level navigation. |

::: warning HTML structure
A `Menu` must have **exactly one** direct `MenuBtn` and **one** direct `MenuList`. For deeper menus, nest additional `Menu` components inside the parent's `MenuList`.
:::

## Nested example

```
┌ Menu
├─ MenuBtn
├─ MenuList
├───┬ Menu
│   ├─ MenuBtn
│   └─ MenuList
└───┬ Menu
    ├─ MenuBtn
    └─ MenuList
```

See the [JavaScript API](./js-api.md) for the options exposed by each part.
