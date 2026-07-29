---
title: ClickOutside JS API
---

# JS API

The `ClickOutside` primitive has no options or refs. It listens to clicks on the `document` and, whenever one lands outside of its root element, dispatches a single [`click-outside`](#click-outside) event on that element. It is meant to be paired with the [`Action`](/components/Action/) component on the same element to react to the event declaratively.

## Events

### `click-outside`

- Type: `CustomEvent`
- Bubbles: `false`
- Detail: `{ event: MouseEvent }`

Dispatched on the component's root element when a `click` occurs outside of it. The detection uses [`Event.composedPath()`](https://developer.mozilla.org/en-US/docs/Web/API/Event/composedPath), so a click on the element itself or on any of its descendants is considered _inside_ and does **not** trigger the event.

The original `MouseEvent` that triggered the detection is forwarded on the `detail.event` property.

#### Listening with `Action`

Because [`Action`](/components/Action/) binds native listeners on its element, add both components to the same element and use the [`on:<event>` option](/components/Action/js-api.html#on-event-modifier) to react to the emitted event:

<!-- prettier-ignore-start -->
```html {3}
<div
  data-component="ClickOutside Action"
  data-on:click-outside="this.hidden = true">
  ...
</div>
```
<!-- prettier-ignore-end -->

#### Accessing the original event

The original `MouseEvent` is available through `event.detail.event` in the effect:

<!-- prettier-ignore-start -->
```html {3}
<div
  data-component="ClickOutside Action"
  data-on:click-outside="console.log(event.detail.event.target)">
  ...
</div>
```
<!-- prettier-ignore-end -->
