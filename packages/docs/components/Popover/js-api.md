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

- Type: `Array<Transition | ViewTransition>`

A getter returning every [`Transition`](/components/Transition/) and [`ViewTransition`](/components/ViewTransition/) child the popover orchestrates.

## Methods

### `open`

- Returns `Promise<void>`

Open the popover: call [`showPopover()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/showPopover), emit `open`, then run every child's `enter()`. A no-op if the popover is already open. Resolves once the enter transitions have finished.

### `close`

- Returns `Promise<void>`

Close the popover: emit `close`, run every child's `leave()`, **then** call [`hidePopover()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/hidePopover) — so the popover is still painted while its children animate out. A no-op if the popover is already closed. Resolves once hidden.

### `toggle`

- Returns `Promise<void>`

Call `close()` if the popover is open, `open()` otherwise.

## Events

### `open`

Emitted when the popover starts opening, before the enter transitions run. Also emitted when a `popover="auto"` element is opened by the platform.

### `close`

Emitted when the popover starts closing, before the leave transitions run. Also emitted when a `popover="auto"` element is light-dismissed by the platform (outside click or <kbd>Esc</kbd>).
