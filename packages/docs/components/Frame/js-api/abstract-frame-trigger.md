---
title: AbstractFrameTrigger
---

# AbstractFrameTrigger

## Options

### `requestInit`

- Type: `RequestInit`
- Default: `{}`

Use this option to customize the options for the fetch request.

### `headers`

- Type: `Record<string, string>`
- Default: `{}`

Use this option to add custom headers to the fetch request. The headers will be merge with any `$options.requestInit.headers` already defined.

## Getters

### `url`

- Return: `URL`
- Default: `this.$el.href` or `this.$el.action` depending on the type of the root element

### `requestInit`

- Return: `RequestInit`
- Default: the `requestInit` and `headers` options merged

## Methods

### `trigger`

- Return: `Promise<void>`

This method will be called by components extending the `AbstractFrameTrigger` to notify its parent `Frame` to fetch content.

## Emits

### `frame-trigger`

- Parameters:
  - `url` (`URL`): the value returned by the `url` getter
  - `requestInit` (`RequestInit`): the value returned by the `requestInit` getter

Emitted from the [`trigger` method](#trigger), when the component needs a request to be made by its parent `Frame` component.

### `frame-fetch-before`

- Parameters:
  - `url` (`URL`): the URL requested
  - `requestInit` (`RequestInit`): options for the fetch function

Emitted before the request starts.

### `frame-fetch`

- Parameters:
  - `url` (`URL`): the URL requested
  - `requestInit` (`RequestInit`): options for the fetch function

Emitted when the request starts.

### `frame-fetch-after`

- Parameters:
  - `url` (`URL`): the URL requested
  - `requestInit` (`RequestInit`): options for the fetch function
  - `content` (`string | Error`): the content of the request if successful, an error otherwise

Emitted after the fetch request, be it successfull or not. The third parameter can be either the content of the response or an error instance.

### `frame-content`

- Parameters:
  - `url` (`URL`): the URL requested
  - `requestInit` (`RequestInit`): options for the fetch function
  - `content` (`string`): the content of the response

Emitted when the content of the request has been successfully received, but before its insertion in the current page.

### `frame-content-after`

- Parameters:
  - `url` (`URL`): the URL requested
  - `requestInit` (`RequestInit`): options for the fetch function
  - `content` (`string`): the content of the response

Emitted after each `FrameTarget` component has received and updated its content, but before the final update on the root of the application which scan the updated content for components to mount.

### `frame-error`

- Parameters:
  - `url` (`URL`): the URL requested
  - `requestInit` (`RequestInit`): options for the fetch function
  - `error` (`Error`): a fetch error

Emitted when the fetch request or the update of the content throw an error.
