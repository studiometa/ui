# Slider

## Options

### `mode`

- Type: `'left' | 'center' | 'right'`
- Default: `'left'`

Defines how the slider items are aligned.

### `fitBounds`

- Type: `boolean`
- Default: `false`

Forces items to align themselves on drag end.

### `contain`

- Type: `boolean`
- Default: `false`

Prevents the first and last items from overflowing.

Not compatible with `mode="center"`: that combination reports a `slider.incompatible-modes` warning and containment is skipped. Use it with `left` or `right`.

### `sensitivity`

- Type: `number`
- Default: `1`

Multiplier for the drag.

### `dropSensitivity`

- Type: `number`
- Default: `2`

Multiplier for the drag end inertia.

## Refs

### `wrapper`

- Type: `HTMLElement`

The element wrapping all the `SliderItem` components. Every item position is measured from it.

It also carries the arrow-key handler: with focus inside the wrapper, <kbd>←</kbd> and <kbd>→</kbd> call `goPrev()` and `goNext()`. Give the wrapper a `tabindex="0"` so it can receive focus, as the examples do.

## Methods

### `goTo(index: number)`

- Parameters:
  - `index` (`number`): the item index to go to (zero-based)
- Return: `void`

Go to the given zero-based index.

### `goPrev()`

- Return: `void`

Go to the previous item.

### `goNext()`

- Return: `void`

Go to the next item.

### `refresh()`

- Return: `void`

Re-measures every slide's geometry and republishes the current state. It is called for you on mount, on resize, and whenever a slide is added or removed; call it by hand after a layout change those cannot observe.

## Events

### `goto`

Emitted when the index is updated through the `goTo()` method. The `detail` carries `index` (`number`), the index the slider is going to.

### `index`

Emitted whenever the current index is assigned — including when a `goTo()` call or a re-measure resolves to the index already active, so it also fires on a resize with an unchanged value. The `detail` carries `index` (`number`), the new index value. Compare against your own last value if you need change-only semantics.

## Properties

### `state`

- Type: `Signal<{ index: number; total: number }>`

The signal every control subscribes to. It is published on each index change and on each refresh.

### `api`

- Type: `SliderApi`

The `{ state, goTo, goNext, goPrev }` object provided through `SliderContext` during construction, so the controls can resolve it before they mount.

### `items`

- Type: `ChildrenCollection<SliderItem>`

Every mounted `SliderItem` in the subtree, in DOM order. It is live: adding or removing a slide triggers a refresh.

### `currentIndex`

- Type: `number`

The active slide's position. Assigning it activates the new slide, deactivates the previous one, emits `index` and republishes `state`. It does not move the slides — use `goTo()` for that.

### `indexMax`

- Type: `number`

`items.size - 1`.

### `currentSliderItem`

- Type: `SliderItem | undefined`

The active slide.

## Accessibility

Mounting sets `role="group"` and `aria-roledescription="carousel"` on the root element.
