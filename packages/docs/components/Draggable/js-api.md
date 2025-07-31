---
title: Draggable JS API
---

# JS API

The `Draggable` component uses the [`withDrag` decorator](https://js-toolkit.studiometa.dev/api/decorators/withDrag.html) of the [`@studiometa/js-toolkit` package](https://js-toolkit.studiometa.dev) and inherits from all of its APIs.

## Options

### `x`

- Type: `boolean`
- Default: `true`

Enable/disable moving the [`target` ref](#target) on the `x` axis. Defaults to `true`, use the `data-option-no-x` attribute to disable it.

### `y`

- Type: `boolean`
- Default: `true`

Enable/disable moving the [`target` ref](#target) on the `y` axis. Defaults to `true`, use the `data-option-no-y` attribute to disable it.

### `fitBounds`

- Type: `boolean`
- Default: `false`

Wether or not to force the [`target` ref](#target) to always come back in the root element's bounds. Use the `data-option-fit-bounds` attribute to enable it.

### `strictFitBounds`

- Type: `boolean`
- Default: `false`

Wether or not to force the [`target` ref](#target) to strictly stay in the root element's bounds. Use the `data-option-strict-fit-bounds` attribute to enable it.

### `sensitivity`

- Type: `number`
- Default: `0.5`

A number between in the range `0–1` used to smoothen the transition between each position.

### `dropSensitivity`

- Type: `number`
- Default: `0.1`

A number between in the range `0–1` used to smoothen the transition between each position when the drag has ended and inertia is active.

## Properties

### `props`

- Type: `{ x: number, y: number, originX: number, originY: number, dampedX: number, dampedY: number , progressX: number, progressY: number }`

The values used to calculate and render the dragged element.

## Getters

### `target`

- Return: `HTMLElement`
- Default: `this.$refs.target`

The element that will move when the drag is happening.

### `parent`

- Return: `HTMLElement`
- Default: `this.$el`

The element used to calculate the bound limits when the [`fitBounds` option](#fitbounds) is enabled.

### `bounds`

- Return: `{ yMin: number, yMax: number, xMin: number, xMax: number }`
- Default: the minimum and maximum position for the `target` element to stay in the `parent` bounds

## Methods

### `render()`

- Parameters: none
- Returns: `void`

Update the target position.

## Emits

### `drag-start`

- Parameters:
  - `props` (`typeof this.props`): the [`props` property](#props) of the instance

Emitted when the drag starts (pointer down).

### `drag-drag`

- Parameters:
  - `props` (`typeof this.props`): the [`props` property](#props) of the instance

Emitted while the drag is moving (pointer move).

### `drag-drop`

- Parameters:
  - `props` (`typeof this.props`): the [`props` property](#props) of the instance

Emitted when the drag stops (pointer up).

### `drag-inertia`

- Parameters:
  - `props` (`typeof this.props`): the [`props` property](#props) of the instance

Emitted when the drag target is moving with inertia.

### `drag-stop`

- Parameters:
  - `props` (`typeof this.props`): the [`props` property](#props) of the instance

Emitted when the drag target has settled its position when the [`fitBounds` option](#fitbounds) is not enabled.

### `drag-fit`

- Parameters:
  - `props` (`typeof this.props`): the [`props` property](#props) of the instance

Emitted when the drag target has settled its position when the [`fitBounds` option](#fitbounds) is enabled.

### `drag-render`

- Parameters:$
  - `props` (`typeof this.props`): the [`props` property](#props) of the instance

Emitted after the DOM has been updated.
