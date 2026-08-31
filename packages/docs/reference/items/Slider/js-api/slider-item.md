# SliderItem

This component represents a single item of the slider. It manages moving the item as well as setting accessibility attributes.

On mount it sets `role="group"`, `aria-roledescription="slide"` and an `aria-label` derived from the component instance ID.

## Properties

### `x`

- Type: `number`

The target horizontal position, in pixels.

### `dampedX`

- Type: `number`

The smoothed position actually written to the element's `transform`.

### `rect`

- Type: `{ x: number; width: number }`

Position and width as if the slide were untranslated. It is cached, and invalidated on resize.

## Methods

### `move(targetPosition)`

- Parameters: `targetPosition` (`number`)
- Returns: `void`

Moves to a position with inertia, damping towards it frame by frame and releasing the frame subscription once it settles.

### `moveInstantly(targetPosition)`

- Parameters: `targetPosition` (`number`)
- Returns: `void`

Moves to a position immediately, with no animation. This is what drag uses to follow the pointer.

### `render()`

- Returns: `void`

Writes the current `dampedX` to the element's `transform`.

### `activate()` and `disactivate()`

- Returns: `void`

Add and remove the `is-active` class. `Slider` calls them as the current index changes.
