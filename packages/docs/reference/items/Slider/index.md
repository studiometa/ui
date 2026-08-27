---
badges: [JS]
---

# Slider <Badges :texts="$frontmatter.badges" />

## Usage

Use the `Slider` component to display items on the X axis and enable indexed navigation between them.

::: code-group

```js twoslash [app.js]
import { registerComponent } from '@studiometa/js-toolkit';
import { Slider } from '@studiometa/ui';

registerComponent(Slider);
```

```twig [slider.twig]
<div data-component="Slider">
  <div data-ref="wrapper" data-component="SliderDrag" class="flex gap-4">
    {% for item in 1..4 %}
      <div data-component="SliderItem" class="grow-0 shrink-0">
        #{{ item }}
      </div>
    {% endfor %}
  </div>
</div>
```

:::

By default, the `SliderItem` and `SliderDrag` components are included in the `Slider`. You can add more controls with the following components:

- `SliderBtn` to add previous and next buttons
- `SliderCount` to display the current index of the slider
- `SliderDots` to have a secondary navigation
- `SliderProgress` to add a progress bar

`Slider` declares only `SliderItem` and `SliderDrag` as its own children, so register the other members yourself:

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

Registering a member is enough for it to mount: a component is found by its own `data-component` token, wherever it sits in the slider's markup.
