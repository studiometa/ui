---
title: Slider anatomy
---

# Anatomy

`Slider` is a compound component. The root coordinates a track of items and any number of optional controls, all declared as child components. Use this map to see which parts exist and how they nest.

## Structure

```
Slider                                 data-component="Slider"
├─ SliderDrag       [data-ref="wrapper"]   the draggable track      (required)
│  └─ SliderItem    (× n)                  a single slide           (required)
├─ SliderBtn        (× 2, prev / next)     navigation buttons       (optional)
├─ SliderCount                             current / total index    (optional)
├─ SliderDots                              secondary navigation     (optional)
└─ SliderProgress                          progress bar             (optional)
```

## Parts

| Part | Selector | Required | Role |
| --- | --- | --- | --- |
| Root | `data-component="Slider"` | Yes | Owns the index and drives every child. |
| Track | `data-component="SliderDrag"` | Yes | The `data-ref="wrapper"` element holding the slides; enables drag. |
| Item | `data-component="SliderItem"` | Yes (× n) | One slide. |
| Button | `data-component="SliderBtn"` | Optional | Previous / next control. |
| Count | `data-component="SliderCount"` | Optional | Displays the current index. |
| Dots | `data-component="SliderDots"` | Optional | Secondary dot navigation. |
| Progress | `data-component="SliderProgress"` | Optional | Progress indicator. |

## Registering the parts

`SliderItem` and `SliderDrag` are registered on `Slider` by default. To use any of the optional controls you must extend `Slider` and register the extra children yourself:

```js twoslash [Slider.js]
import {
  Slider as SliderCore,
  SliderBtn,
  SliderCount,
  SliderDots,
  SliderDrag,
  SliderItem,
  SliderProgress,
} from '@studiometa/ui';

export class Slider extends SliderCore {
  static config = {
    components: {
      SliderBtn,
      SliderCount,
      SliderDots,
      SliderDrag,
      SliderItem,
      SliderProgress,
    },
  };
}
```

See the [JavaScript API](./js-api/) for the options exposed by each part.
