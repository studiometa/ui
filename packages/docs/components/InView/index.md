---
badges: [JS]
---

# InView <Badges :texts="$frontmatter.badges" />

The `InView` primitive emits directional viewport events, letting you react differently when an element **enters** or **leaves** the viewport.

## Usage

The `InView` primitive should be used as a child component to listen to its `in-view` and `out-of-view` events. Unlike the [`Sentinel` primitive](/components/Sentinel/) — whose single `intersected` event fires on both enter and leave — `InView` is its directional counterpart: it tells you which way the element crossed the viewport boundary.

It is built on the [`withMountWhenInView` decorator](https://js-toolkit.studiometa.dev/api/decorators/withMountWhenInView.html): the component mounts when it enters the viewport (emitting `in-view`) and is destroyed when it leaves (emitting `out-of-view`), re-firing on each re-entry.

If you only need to react to the first entry, use the [`InViewOnce` variant](/components/InViewOnce/), which emits `in-view` a single time and never emits `out-of-view`.

```js {2,8,12-18}
import { Base } from '@studiometa/js-toolkit';
import { InView } from '@studiometa/ui';

export default class Component extends Base {
  static config = {
    name: 'Component',
    components: {
      InView,
    },
  };

  onInViewInView() {
    // the element entered the viewport
  }

  onInViewOutOfView() {
    // the element left the viewport
  }
}
```

```html
<div data-component="Component">
  <div data-component="InView">...</div>
</div>
```
