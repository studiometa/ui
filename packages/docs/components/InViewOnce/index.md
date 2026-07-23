---
badges: [JS]
---

# InViewOnce <Badges :texts="$frontmatter.badges" />

The `InViewOnce` primitive is a one-shot variant of the [`InView` primitive](/components/InView/) that emits `in-view` once, when the element first enters the viewport, and never emits `out-of-view`.

## Usage

Use `InViewOnce` when you only care about the first time an element becomes visible, for example to trigger a one-off reveal, lazy-load or analytics impression. It is built on the [`withMountWhenInView` decorator](https://js-toolkit.studiometa.dev/api/decorators/withMountWhenInView.html): the component mounts on entry (emitting `in-view`) and then terminates, disconnecting its observer so the event never fires again.

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

## Usage with the `Action` component

The [`Action` component](/components/Action/) can react to the `in-view` event without any custom class. Mount both on the same element to trigger a one-off effect:

```html
<div
  data-component="Action InViewOnce"
  data-on:in-view="$el.classList.add('is-visible')">
  ...
</div>
```

::: info
[`$emit`](https://js-toolkit.studiometa.dev/api/methods/emit.html) dispatches a native `CustomEvent` on the component's root element, which is what lets `Action` react to the event.
:::

See the [examples](./examples.md) for a live one-shot reveal demo, and the [JavaScript API](./js-api.md) for the full list of options and events.
