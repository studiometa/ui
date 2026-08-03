---
title: Toaster JS API
outline: deep
---

# JS API

## Options

### `duration`

- Type: `Number`
- Default: `5000`

The default lifetime of a toast, in milliseconds, before it auto-dismisses. Set it with `data-option-duration` on the `Toaster` element, or override it per toast through the `duration` field of [`show()`](#show). A value of `0` makes toasts sticky by default — they then close only via [`dismiss()`](#dismiss) or their close button.

<!-- prettier-ignore-start -->
```html {2}
<div data-component="Toaster"
  data-option-duration="8000">
  ...
</div>
```
<!-- prettier-ignore-end -->

## Refs

### `polite`

- Type: `HTMLElement`

The `aria-live="polite"` region receiving every non-error toast. Announced once the screen reader is idle. Required.

### `assertive`

- Type: `HTMLElement`

The `aria-live="assertive"` region receiving `error` toasts, announced immediately. Optional — when absent, error toasts fall back to the `polite` region.

### `template`

- Type: `HTMLTemplateElement`

The `<template>` whose first element child is cloned for each toast. The clone should contain a `[data-message]` element (its text is set to the message) and a `[data-close]` element (clicking it dismisses the toast).

## Methods

### `show`

- `show(message: string, options?: { type?: string; duration?: number }): HTMLElement`

Create a toast holding `message`, append it to the matching region through the [`viewTransition`](/reference/items/ViewTransition/) scheduler, and arm its auto-dismiss timer. Returns the created toast element (usable later with [`dismiss()`](#dismiss)).

- `type` — the toast kind, mirrored on the element as `data-type` for styling. `error` routes to the assertive region; any other value (default `'info'`) routes to the polite one.
- `duration` — overrides the [`duration`](#duration) option for this toast. Pass `0` for a sticky toast.

Emits [`show`](#show-1).

### `dismiss`

- `dismiss(toast: HTMLElement): void`

Remove a toast returned by [`show()`](#show), clearing its pending timer and running the leave transition through the scheduler. A no-op once the toast is gone.

Emits [`dismiss`](#dismiss-1).

## Events

### `show`

- Arguments: `(toast: HTMLElement, message: string, type: string)`

Emitted synchronously when a toast is created, before it is appended.

### `dismiss`

- Arguments: `(toast: HTMLElement)`

Emitted when a toast starts leaving, before it is removed.
