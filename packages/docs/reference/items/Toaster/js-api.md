---
title: Toaster JS API
outline: deep
---

# JS API

## Toaster

### Options

#### `duration`

- Type: `Number`
- Default: `5`

The default lifetime of a toast, in seconds (matching the [`Timer`](/reference/items/Timer/) convention), before it auto-dismisses. Set it with `data-option-duration` on the `Toaster` element, or override it per toast through the `duration` field of [`show()`](#show). It is written onto each toast as [`Toast`](#toast)'s `delay`; a value of `0` disables the toast's autostart, leaving it sticky until closed on demand.

<!-- prettier-ignore-start -->
```html {2}
<div data-component="Toaster"
  data-option-duration="8">
  ...
</div>
```
<!-- prettier-ignore-end -->

### Refs

#### `polite`

- Type: `HTMLElement`

The `aria-live="polite"` region receiving every non-error toast. Announced once the screen reader is idle. Required.

#### `assertive`

- Type: `HTMLElement`

The `aria-live="assertive"` region receiving `error` toasts, announced immediately. Optional — when absent, error toasts fall back to the `polite` region.

#### `template`

- Type: `HTMLTemplateElement`

The `<template>` whose first element child is cloned for each toast. The clone is tagged as a [`Toast`](#toast) automatically, so the markup only needs a `[data-message]` element (its text is set to the message) and, optionally, a `close` ref.

### Methods

#### `show`

- `show(message: string, options?: { type?: string; duration?: number }): HTMLElement`

Clone a toast holding `message`, set its type / unique `view-transition-name` / lifetime, and append it to the matching region through the [`viewTransition`](/reference/items/ViewTransition/) scheduler. Returns the created toast element. The registry mounts it as a [`Toast`](#toast), which owns its dismissal.

- `type` — the toast kind, mirrored on the element as `data-type` for styling. `error` routes to the assertive region; any other value (default `'info'`) routes to the polite one.
- `duration` — overrides the [`duration`](#duration) option (in seconds) for this toast. Pass `0` for a sticky toast.

Emits [`show`](#show-1).

### Events

#### `show`

- Arguments: `(toast: HTMLElement, message: string, type: string)`

Emitted synchronously when a toast is created, before it is appended.

## Toast

`Toast` extends the [`Timer`](/reference/items/Timer/) primitive, so it inherits Timer's options (`delay`, `autostart`, `repeat`), its `timer-*` events and its imperative methods (`pause()`, `resume()`, `start()`, `stop()`). Only the toast-specific additions are listed here; a `Toaster` sets `delay`/`autostart` for you from its [`duration`](#duration).

### Refs

#### `close`

- Type: `HTMLElement`

Optional. When present, clicking it dismisses the toast.

### Methods

#### `dismiss`

- `dismiss(): void`

Cancel the countdown, emit [`dismiss`](#dismiss-1) and animate the toast out through the [`viewTransition`](/reference/items/ViewTransition/) scheduler before removing its element (the registry then destroys the component). Called automatically when the countdown ends or the `close` ref is clicked. Idempotent.

### Events

#### `dismiss`

- Arguments: `(toast: HTMLElement)`
- Bubbles

Emitted when the toast starts leaving, before it is removed.
