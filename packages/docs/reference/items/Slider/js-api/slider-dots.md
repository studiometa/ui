# SliderDots

Displays a secondary navigation for the main slider.

`SliderDots` is built on the [`withTransition` mixin](/reference/items/withTransition/), so it accepts every [transition option](/reference/items/Transition/js-api#options) — `enterFrom`, `enterActive`, `enterTo`, `enterKeep`, `leaveFrom`, `leaveActive`, `leaveTo` and `leaveKeep`. On each index change the outgoing dot leaves and the incoming dot enters, so `data-option-enter-to` together with `data-option-enter-keep` is the usual way to mark the active dot.

## Refs

### `dots[]`

- Type: `HTMLButtonElement[]`

A list of native buttons, one per slide. Clicking one navigates to its index.

## Properties

### `currentIndex`

- Type: `number`

The index of the currently active dot, or `-1` before the first update.

### `target`

- Type: `HTMLButtonElement[]`

The whole `dots` ref list — the default transition target. Each `update()` overrides it with a single dot for one call, so the outgoing dot leaves while the incoming one enters.

## Methods

### `update(index)`

- Parameters: `index` (`number`)
- Returns: `void`

Transitions from the current dot to the one at `index`. It is called for you on every slider state change, and is a no-op when the index has not changed.
