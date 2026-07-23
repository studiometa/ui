---
badges: [JS]
---

# InView <Badges :texts="$frontmatter.badges" />

The `InView` primitive emits directional events when an element enters or leaves the viewport.

## Usage

The `InView` primitive should be used as a child component to listen to its `in-view` and `out-of-view` events. It emits a directional `in-view` / `out-of-view` pair, unlike [`Sentinel`](/components/Sentinel/), whose `intersected` event fires on both enter and leave.

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

## Usage with the `Action` component

The [`Action` component](/components/Action/) can react to the `in-view` / `out-of-view` events without any custom class. Mount both on the same element and wire the events with `data-on:` attributes:

```html
<div
  data-component="Action InView"
  data-on:in-view="$el.classList.add('is-visible')"
  data-on:out-of-view="$el.classList.remove('is-visible')">
  ...
</div>
```

::: info
[`$emit`](https://js-toolkit.studiometa.dev/api/methods/emit.html) dispatches a native `CustomEvent` on the component's root element, which is what lets `Action` react to these events.
:::

::: tip Example
See the [examples](./examples.md) for live reveal-on-scroll demos, and the [JavaScript API](./js-api.md) for the full list of options and events.
:::
