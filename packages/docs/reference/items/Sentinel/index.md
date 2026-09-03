---
badges: [JS]
---

# Sentinel <Badges :texts="$frontmatter.badges" />

The `Sentinel` primitive — whose name is inspired by a [Google Developer article](https://developers.google.com/web/updates/2017/09/sticky-headers) — will help you react to an element's visibility.

## Usage

The `Sentinel` should be used as a child component to be able to listen to its `intersected` event when the element enters or leaves the viewport. The main usage is for the detection of an element stickiness (see the [Sticky component](/reference/items/Sticky/)).

If you need to react differently depending on whether the element is entering or leaving the viewport, use the directional [`InView` primitive](/reference/items/InView/) instead, which emits distinct `in-view` and `out-of-view` events.

```js {2,8,12-14}
import { Base } from '@studiometa/js-toolkit';
import { Sentinel } from '@studiometa/ui';

export default class Component extends Base {
  static config = {
    name: 'Component',
    components: {
      Sentinel,
    },
  };

  onSentinelIntersected({ payload }) {
    // `payload` is `{ isInView, entry }`
  }
}
```

Importing a module only defines the class: no `@studiometa/ui` component registers itself. Registering `Component` also registers the `Sentinel` it declares in `config.components`.

```js
import { registerComponent } from '@studiometa/js-toolkit';
import Component from './Component.js';

registerComponent(Component);
```

```html
<div data-component="Component">
  <div data-component="Sentinel"></div>
</div>
```
