---
title: LazyInclude JS API
---

# JS API

## Options

### `src`

- Type: `string`
- Default: `''`

The source URL where the content will be fetched from.

### `terminateOnLoad`

- Type: `boolean`
- Default: `false`

Use this option to terminate the component once the content has been inserted in the page or the error has been displayed.

## Refs

### `loading`

- Type: `HTMLElement`

This ref can be used to display a loading state. It will be hidden once the content has been successfully fetched.

### `error`

- Type: `HTMLElement`

This ref should be used to display an error message when the fetch fails. It should be hidden by default, a `display: block` style will be added on error.

## Events

### `content`

- Parameters:
  - `content` (`string`): the content to be inserted in the DOM

Emitted when the content has been fetched.

### `error`

- Parameters:
  - `error` (`Error`): the error thrown

Emitted when the fetch request has failed.

### `always`

Emitted at the end of the fetch request, successful or not.
