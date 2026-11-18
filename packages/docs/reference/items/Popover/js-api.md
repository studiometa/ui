---
title: Popover JS API
outline: deep
---

# JS API

## Properties

### `popover`

- Type: `HTMLElement`

A getter returning the native `[popover]` element (`this.$el`).

### `transitions`

- Type: `Transitionable[]`

A getter returning every [`Transition`](/reference/items/Transition/) and [`ViewTransition`](/reference/items/ViewTransition/) child the popover orchestrates.

### `isOpen`

- Type: `boolean`

Whether the popover is open or opening. It is `false` as soon as `close()` starts, while the leave transitions still hold the popover painted.

## Methods

### `open`

- Returns `Promise<void>`

Open the popover: call [`showPopover()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/showPopover), emit the extendable `open` event and run every transition child's `enter()`. A no-op if the popover is already open. Resolves once every enter transition **and** every registered extension has finished.

An `open()` call during the leave transitions of a `close()` keeps the popover shown.

### `close`

- Returns `Promise<void>`

Close the popover: emit the extendable `close` event and run every transition child's `leave()`, await both, **then** call [`hidePopover()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/hidePopover). The popover stays painted while its children animate out. A no-op if the popover is already closed. Two overlapping calls share one run. Resolves once hidden.

### `toggle`

- Returns `Promise<void>`

Call `close()` if the popover is open, `open()` otherwise.

## Events

Both lifecycle events are **extendable**, as on [`Dialog`](/reference/items/Dialog/js-api#events): they bubble up the DOM tree, and their `detail` carries a `waitUntil()` function. A listener calls it to hold the choreography open. See [Extending the lifecycle with `waitUntil`](/reference/items/Dialog/js-api#extending-the-lifecycle-with-waituntil) for the accepted shapes and the rules.

### `open`

- Detail: `{ waitUntil(extension) }`

Emitted when the popover starts opening, after `showPopover()` and before the enter transitions run. Also emitted when the platform shows the popover, for example from a `popovertarget` button. The enter transitions run in that case too.

### `close`

- Detail: `{ waitUntil(extension) }`

Emitted when the popover starts closing, before the leave transitions run and before `hidePopover()`. Also emitted when the platform hides a `popover="auto"` element (light-dismiss or <kbd>Esc</kbd>). The popover is already hidden in that case, so the leave transitions do not run.
