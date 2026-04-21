---
title: Hoverable JS API
---

# JS API

The `Hoverable` component uses the [`withRelativePointer` decorator](https://js-toolkit.studiometa.dev/api/decorators/withRelativePointer.html) of the [`@studiometa/js-toolkit` package](https://js-toolkit.studiometa.dev) and inherits from all of its APIs.

## Options

### `sensitivity`

- Type: `number`
- Default: `0.1`

A number between in the range `0–1` used to smoothen the transition between each position.

### `reversed`

- Type: `boolean`
- Default: `false`

Use this option to reverse the movement of the target.

### `contained`

- Type: `boolean`
- Default: `false`

Use this option to stop moving the target element when the pointer has leaved the root element.

### `shape`

- Type: `'rect' | 'circle' | 'ellipse'`
- Default: `'rect'`

Use this option to constrain the target movement to an inscribed shape instead of the default rectangular bounds.

## Properties

### `props`

- Type: `{ x: number, y: number, dampedX: number, dampedY: number }`

The values used to calculate and render the position of the target element.

## Methods

### `constrainPosition`

- Signature: `(x: number, y: number, bounds = this.bounds) => { x: number, y: number }`

Constrains the given position to the configured bounding shape.

By default, this method supports the built-in `rect`, `circle` and `ellipse` shapes. You can override it in a custom component to implement more advanced constraints.

## Getters

### `target`

- Return: `HTMLElement`
- Default: `this.$refs.target`

The element that will move on mouse move.

### `parent`

- Return: `HTMLElement`
- Default: `this.$el`

The element used to calculate the bound limits.

### `bounds`

- Return: `{ yMin: number, yMax: number, xMin: number, xMax: number }`
- Default: the minimum and maximum position for the `target` element to stay in the `parent` bounds

The `shape` option uses these bounds as its base rectangle and constrains the target to either that rectangle, an inscribed circle, or an inscribed ellipse.
