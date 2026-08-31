---
title: Slider anatomy
---

# Anatomy

`Slider` is a compound component. The root coordinates a track of items and any number of optional controls, all declared as child components. Use this map to see which parts exist and how they nest.

## Structure

```
Slider                                 data-component="Slider"
├─ wrapper          [data-ref="wrapper"]   the track, origin of every
│                                          measurement              (required)
│  ├─ SliderDrag                           adds pointer dragging    (optional)
│  └─ SliderItem    (× n)                  a single slide           (required)
├─ SliderBtn        (× 2, prev / next)     navigation buttons       (optional)
├─ SliderCount                             current / total index    (optional)
├─ SliderDots                              secondary navigation     (optional)
└─ SliderProgress                          progress bar             (optional)
```

The nesting above is the conventional layout, not a constraint: `Slider` collects its slides and its controls from anywhere in its subtree, by their `data-component` token.

## Parts

| Part     | Selector                          | Required  | Role                                                                                                      |
| -------- | --------------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| Root     | `data-component="Slider"`         | Yes       | Owns the index and drives every child.                                                                    |
| Track    | `[data-ref="wrapper"]`            | Yes       | The element holding the slides. Every position is measured from it, and it carries the arrow-key handler. |
| Drag     | `data-component="SliderDrag"`     | Optional  | Added on the `wrapper` element to enable pointer dragging.                                                |
| Item     | `data-component="SliderItem"`     | Yes (× n) | One slide.                                                                                                |
| Button   | `data-component="SliderBtn"`      | Optional  | Previous / next control.                                                                                  |
| Count    | `data-component="SliderCount"`    | Optional  | Displays the current index.                                                                               |
| Dots     | `data-component="SliderDots"`     | Optional  | Secondary dot navigation.                                                                                 |
| Progress | `data-component="SliderProgress"` | Optional  | Progress indicator.                                                                                       |

## Registering the parts

`SliderItem` and `SliderDrag` are registered on `Slider` by default. To use any of the optional controls, register them yourself:

```js twoslash [app.js]
import { registerComponents } from '@studiometa/js-toolkit';
import {
  Slider,
  SliderBtn,
  SliderCount,
  SliderDots,
  SliderDrag,
  SliderItem,
  SliderProgress,
} from '@studiometa/ui';

registerComponents(
  Slider,
  SliderBtn,
  SliderCount,
  SliderDots,
  SliderDrag,
  SliderItem,
  SliderProgress,
);
```

See the [JavaScript API](./js-api/) for the options exposed by each part.

## Accessibility

Mounting sets `role="group"` and `aria-roledescription="carousel"` on the root, and `role="group"`, `aria-roledescription="slide"` and an `aria-label` on each slide. Give the `wrapper` a `tabindex="0"` so its arrow-key navigation is reachable.
