# Slider

## Options

### `mode`

- Type: `'left' | 'center' | 'right'`
- Default: `'left'`

Defines how the slider items are aligned.

### `fitBounds`

- Type: `boolean`
- Default: `false`

Set to `true` to force items to align themselves on drag end.

### `contain`

- Type: `boolean`
- Default: `false`

Set to `true` to prevent first and last items to overflow.

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

The element wrapping all the `SliderItem` components. Used as reference for calculation of the items position.

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

## Events

### `goto`

- Parameters:
  - `index` (`number`): the index the slider is going to

Emitted when the index is updated via the `goTo(index:number)` method.

### `index`

- Parameters:
  - `index` (`number`): the new index value

Emitted when the current index is changed.
