# SliderDrag

Adds drag capabilities to the slider. It should wrap the slider items, usually placed on the [`wrapper` ref](./slider.md#wrapper).

```html
<div data-component="Slider">
  <div data-ref="wrapper" data-component="SliderDrag">
    <div data-component="SliderItem"></div>
    <div data-component="SliderItem"></div>
    ...
  </div>
</div>
```

This component uses the [`withDrag` mixin](https://js-toolkit-v4.studiometa.dev/api/services/mixins.html) over the [`useDrag` service](https://js-toolkit-v4.studiometa.dev/api/services/useDrag.html) and inherits their APIs.

## Options

`SliderDrag` declares no options of its own. The underlying drag service is configured in JavaScript — `axis`, `dampFactor`, `dragThreshold`, `inertia` — rather than from markup. Subclass `SliderDrag` and pass your own values to the mixin to change them.

## Events

Each non-idle drag mode is re-emitted under its own name, with the service's `DragProps` as the `detail`. The `idle` mode is filtered out.

### `start`

Emitted when a drag begins.

### `drag`

Emitted on every pointer move during a drag.

### `drop`

Emitted when the pointer is released.

### `inertia`

Emitted on each frame while the drag coasts after `drop`.

### `stop`

Emitted when the movement settles.

`Slider` listens to `start`, `drag` and `drop` through its `onSliderDrag*` handlers.

## Behavior

When the element's computed `touch-action` is `auto`, `SliderDrag` sets an inline `touch-action: pan-y` on mount so vertical page gestures keep working, and restores the previous inline value on unmount. Declare your own `touch-action` in CSS to opt out.
