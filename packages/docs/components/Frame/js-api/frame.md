---
title: Frame
---

# Frame

## Options

### `requestInit`

- Type: `RequestInit`
- Default: `{}`

Use this option to customize the options for the fetch request.

### `headers`

- Type: `Record<string, string>`
- Default: `{}`

Use this option to add custom headers to the fetch request. The headers will be merge with any `$options.requestInit.headers` already defined.

### `history`

- Type: `boolean`
- Default: `false`

Use this options to update the browser's history when performing a request. The [`historyPush` function](https://js-toolkit.studiometa.dev/utils/history/historyPush.html#historypush) will be used in the background.

## Getters

### `id`

- Return: `string`
- Default: `this.$el.id`

### `client`

- Return: `typeof fetch`
- Default: `window.fetch.bind(window)`

### `requestInit`

- Return: `RequestInit`
- Default: merged `requestInit` and `headers` options with additional custom headers

By default, the following custom headers will be added:

- `user-agent`: it will uses the current browser user-agent information with an additional `@studiometa/ui/Frame` suffix.
-  `x-requested-by: @studiometa/ui/Frame`

## Emits

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
