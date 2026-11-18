---
title: Hoverable JS API
---

# JS API

The `Hoverable` component mixes in the pointer and animation-frame services of the [`@studiometa/js-toolkit` package](https://js-toolkit-v4.studiometa.dev) and inherits from all of their APIs.

## Options

### `sensitivity`

- Type: `number`
- Default: `0.1`

A number between in the range `0–1` used to smoothen the transition between each position.

### `reversed`

- Type: `boolean`
- Default: `false`

Reverses the movement of the target.

### `contained`

- Type: `boolean`
- Default: `false`

Stops moving the target element when the pointer has leaved the root element.

### `shape`

- Type: `'rect' | 'circle' | 'ellipse'`
- Default: `'rect'`

The shape the target position is constrained to. `circle` and `ellipse` are inscribed in the rectangle given by the [`bounds` getter](#bounds): a position outside the shape is brought back onto its edge, along the line to its center. `circle` uses the smallest side of that rectangle as its diameter.

```html
<div data-component="Hoverable" data-option-shape="circle">
  <div data-ref="target">...</div>
</div>
```

## Properties

### `props`

- Type: `{ x: number, y: number, dampedX: number, dampedY: number }`

The values used to calculate and render the position of the target element.

## Methods

### `constrainPosition`

- Signature: `(x: number, y: number, bounds?: HoverableBounds) => HoverablePosition`
- `bounds` defaults to `this.bounds`

Constrains a position to the shape given by the [`shape` option](#shape). The component calls it on each pointer move, after it has mapped the pointer position into the bounds. Override it in a child class to constrain the target to another shape.

```js
import { Hoverable } from '@studiometa/ui';

class DiamondHoverable extends Hoverable {
  static config = { ...Hoverable.config, name: 'DiamondHoverable' };

  constrainPosition(x, y, bounds = this.bounds) {
    const centerX = (bounds.xMin + bounds.xMax) / 2;
    const centerY = (bounds.yMin + bounds.yMax) / 2;
    const radiusX = Math.abs(bounds.xMax - bounds.xMin) / 2;
    const radiusY = Math.abs(bounds.yMax - bounds.yMin) / 2;
    const ratio = Math.abs(x - centerX) / radiusX + Math.abs(y - centerY) / radiusY;

    if (ratio <= 1) {
      return { x, y };
    }

    return {
      x: centerX + (x - centerX) / ratio,
      y: centerY + (y - centerY) / ratio,
    };
  }
}
```

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

The [`shape` option](#shape) constrains the target to this rectangle, or to a circle or an ellipse inscribed in it.

## Types

### `HoverableShape` and `HOVERABLE_SHAPES`

```ts
const HOVERABLE_SHAPES = { RECT: 'rect', CIRCLE: 'circle', ELLIPSE: 'ellipse' };
type HoverableShape = 'rect' | 'circle' | 'ellipse';
```

### `HoverableBounds`

```ts
interface HoverableBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}
```

### `HoverablePosition`

```ts
interface HoverablePosition {
  x: number;
  y: number;
}
```
