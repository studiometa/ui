---
badges: [JS]
---

# InViewOnce <Badges :texts="$frontmatter.badges" />

The `InViewOnce` primitive is a one-shot variant of the [`InView` primitive](/components/InView/): it emits `in-view` a single time when the element first enters the viewport, then stops. It never emits `out-of-view`.

## Usage

Use `InViewOnce` when you only care about the first time an element becomes visible — for example to trigger a one-off reveal, lazy-load or analytics impression. It is built on the [`withMountWhenInView` decorator](https://js-toolkit.studiometa.dev/api/decorators/withMountWhenInView.html): the component mounts on entry (emitting `in-view`) and then terminates, disconnecting its observer so the event never fires again.

For a directional listener that keeps reacting to every viewport crossing (both enter and leave), use the [`InView` primitive](/components/InView/) instead.

```js {2,8,12-14}
import { Base } from '@studiometa/js-toolkit';
import { InViewOnce } from '@studiometa/ui';

export default class Component extends Base {
  static config = {
    name: 'Component',
    components: {
      InViewOnce,
    },
  };

  onInViewOnceInView() {
    // the element entered the viewport for the first time
  }
}
```

```html
<div data-component="Component">
  <div data-component="InViewOnce">...</div>
</div>
```
