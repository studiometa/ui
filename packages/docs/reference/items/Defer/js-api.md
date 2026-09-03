---
title: Defer JS API
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

Fetches the content only once per element. When the content has been inserted, a later mount of the same element does not fetch it again. A failed request is not remembered, so mounting the element again retries it.

## Refs

### `loading`

- Type: `HTMLElement`

This ref can be used to display a loading state. It will be hidden once the content has been successfully fetched.

### `error`

- Type: `HTMLElement`

This ref should be used to display an error message when the fetch fails. It should be hidden by default, a `display: block` style will be added on error.

## Events

### `defer-content`

- Parameters:
  - `content` (`string`): the content to be inserted in the DOM

Emitted when the content has been fetched.

### `defer-error`

- Parameters:
  - `error` (`unknown`): the error thrown

Emitted when the fetch request has failed.

### `defer-always`

Emitted at the end of the fetch request, successful or not. On success it is emitted after the fetched content has been inserted and its own components have settled.
