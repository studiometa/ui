---
title: Dialog JS API
outline: deep
---

# JS API

## Options

### `modal`

- Type: `Boolean`
- Default: `true`

Open the dialog as a true modal with [`showModal()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal) — the platform then handles the focus trap, makes the rest of the page [`inert`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert), restores focus on close and paints the dialog in the top layer. Set it to `false` (via `data-option-no-modal`) to use [`show()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/show) instead, which keeps the rest of the page interactive — useful for a slide-in nav.

<!-- prettier-ignore-start -->
```html {2}
<dialog data-component="Action Dialog"
  data-option-no-modal>
  ...
</dialog>
```
<!-- prettier-ignore-end -->

### `trapFocus`

- Type: `Boolean`
- Default: `true`

Trap the tabulation inside the dialog. This is **only meaningful on the non-modal path** (`modal: false`) — `showModal()` already traps focus natively, so the option is a no-op when `modal` is `true`. On the non-modal path it saves the active element on open, keeps <kbd>Tab</kbd> inside the dialog while open, and restores focus on close.

<!-- prettier-ignore-start -->
```html {3}
<dialog data-component="Action Dialog"
  data-option-no-modal
  data-option-no-trap-focus>
  ...
</dialog>
```
<!-- prettier-ignore-end -->

### `scrollLock`

- Type: `Boolean`
- Default: `true`

Lock the scroll on the document element while the dialog is open by toggling `document.documentElement.style.overflow`. Set it to `false` with `data-option-no-scroll-lock` to leave the page scrollable.

## Properties

### `dialog`

- Type: `HTMLDialogElement`

A getter returning the native `<dialog>` element (`this.$el`).

### `transitions`

- Type: `Array<Transition | ViewTransition>`

A getter returning every [`Transition`](/components/Transition/) and [`ViewTransition`](/components/ViewTransition/) child the dialog orchestrates.

## Methods

### `open`

- Returns `Promise<void>`

Open the dialog: call `showModal()` (or `show()` when `modal` is `false`), lock the scroll, emit `open`, then run every child's `enter()`. A no-op if the dialog is already open. Resolves once the enter transitions have finished.

### `close`

- Returns `Promise<void>`

Close the dialog: emit `close`, run every child's `leave()`, **then** call `dialog.close()`, release the focus-trap (non-modal path) and unlock the scroll. A no-op if the dialog is already closed. Resolves once closed.

### `toggle`

- Returns `Promise<void>`

Call `close()` if the dialog is open, `open()` otherwise.

## Events

### `open`

Emitted when the dialog starts opening, before the enter transitions run.

### `close`

Emitted when the dialog starts closing, before the leave transitions run.
