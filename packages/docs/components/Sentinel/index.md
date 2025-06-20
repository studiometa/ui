---
badges: [JS]
---

# Sentinel <Badges :texts="$frontmatter.badges" />

The `Sentinel` primitive — whose name is inspired by a [Google Developer article](https://developers.google.com/web/updates/2017/09/sticky-headers) — will help you react to an element's visbility.

## Usage

The `Sentinel` should be used as a child component to be able to listen to its `intersected` event when the element enters or leaves the viewport. The main usage is for the detection of an element stickyness (see the [Sticky component](/components/Sticky/)).

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

  onSentinelIntersected(entries) {
    // do something with `entries`
  }
}
```
