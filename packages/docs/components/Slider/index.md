---
badges: [JS]
---

# Slider <Badges :texts="$frontmatter.badges" />

## Table of content

- [Examples](./examples.md)
- [JS API](./js-api/index.md)
  - [Slider](./js-api/slider.md)
  - [SliderBtn](./js-api/slider-btn.md)
  - [SliderCount](./js-api/slider-count.md)
  - [SliderDots](./js-api/slider-dots.md)
  - [SliderDrag](./js-api/slider-drag.md)
  - [SliderItem](./js-api/slider-item.md)
  - [SliderProgress](./js-api/slider-progress.md)


## Usage

Use the `Slider` component to display items on a X axis and enable indexed navigation between them.

```js twoslash
import { Base, createApp } from '@studiometa/js-toolkit';
import { Slider } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Slider,
    },
  };
}

export default createApp(App);
```

By default, the `SliderItem` and `SliderDrag` components are included in the `Slider`. You can add more controls with the following components:

- `SliderBtn` to add previous and next buttons
- `SliderCount` to display the current index of the slider
- `SliderDots` to have a secondary navigation
- `SliderProgress` to add a progress bar

These components need to be added as child components of the `Slider` component, so a `Slider` class must be reimplemented in your project:

::: code-group

```js twoslash [Slider.js]
import { Base, createApp } from '@studiometa/js-toolkit';
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

```js twoslash [app.js]
import { Base, createApp } from '@studiometa/js-toolkit';
import { Slider } from './Slider.js';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Slider,
    },
  };
}

export default createApp(App);
```
