---
title: Modal JS API
---

# JS API

## Refs

### `close[]`

HTMLElement references for elements that close the modal when clicked.

### `container`

HTMLElement reference for the modal container element.

### `content`

HTMLElement reference for the modal content element.

### `modal`

HTMLElement reference for the modal root element.

### `open[]`

HTMLElement references for elements that open the modal when clicked.

### `overlay`

HTMLElement reference for the overlay background element.

## Options

### `move`

- Type: `string`
- Default: `undefined`

A CSS selector where to move the modal in the DOM. Useful for moving modals to the end of the body to avoid z-index issues.

### `autofocus`

- Type: `string`
- Default: `'[autofocus]'`

A CSS selector for the element to set focus to when the modal opens. Use `false` to disable autofocus.

### `scrollLock`

- Type: `boolean`
- Default: `true`

Whether to lock scrolling on the document when the modal is open.

### `styles`

- Type: `object`
- Default: `{ modal: { closed: { opacity: '0', pointerEvents: 'none', visibility: 'hidden' } } }`

Configure the styles for different modal states. Each reference can have `open`, `active`, and `closed` style states.

## Methods

### `open()`

- Returns: `Promise<void>`

Open the modal with animations and focus management.

### `close()`

- Returns: `Promise<void>`

Close the modal with animations and restore focus.

## Events

### `open`

Emitted when the modal starts opening.

### `close`

Emitted when the modal starts closing.

## Properties

### `isOpen`

- Type: `boolean`

Whether the modal is currently open or not.
