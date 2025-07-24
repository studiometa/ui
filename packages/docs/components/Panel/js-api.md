---
title: Panel JS API
---

# JS API

The `Panel` component extends the [`Modal`](/components/Modal/js-api.html) component and inherits all its features.

## Options

### `position`

- Type: `'top' | 'right' | 'bottom' | 'left'`
- Default: `'left'`

Configure from which edge of the screen the panel slides in.

## Methods

### `open()`

- Returns: `Promise<void>`

Open the panel with slide-in animation from the configured position.

### `close()`

- Returns: `Promise<void>`

Close the panel with slide-out animation to the configured position.

## Properties

### `isClosing`

- Type: `boolean`

Whether the panel is currently in the process of closing.

### `translateClass`

- Type: `string`

The CSS class used for the translation animation based on the position.

### `containerOffset`

- Type: `string`

The calculated transform matrix for the container offset based on position and dimensions.
