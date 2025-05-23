---
title: Hoverable JS API
---

# JS API

The `Hoverable` component uses the [`withRelativePointer` decorator](https://js-toolkit.studiometa.dev/api/decorators/withRelativePointer.html) of the [`@studiometa/js-toolkit` package](https://js-toolkit.studiometa.dev) and inherits from all of its APIs.

## Options

### `sensitivity`

- Type: `number`
- Default: `0.5`

A number between in the range `0–1` used to smoothen the transition between each position.

### `reversed`

- Type: `boolean`
- Default: `false`

Use this option to reverse the movement of the target.

### `contained`

- Type: `boolean`
- Default: `false`

Use this option to stop moving the target element when the pointer has leaved the root element.

## Properties

### `props`

- Type: `{ x: number, y: number, dampedX: number, dampedY: number }`

The values used to calculate and render the position of the target element.

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
