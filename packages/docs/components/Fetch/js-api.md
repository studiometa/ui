---
title: Fetch JS API
outline: deep
---

# JS API

## Options

### `mode`

- Type: `'replace' | 'prepend' | 'append' | 'morph'`
- Default: `'replace'`

Defines the way the new content will be injected in the page.

### `selector`

- Type: `string`
- Default: `'[id]'`

Use this option to specify which content from the response should be updated in the DOM. This option can be any valid CSS selector.

::: warning ⚠️ Matching with ID
This option can be used to extract specific content from the response, but the matching between the current DOM and the new DOM is still made based on `id` attributes. This means that elements that should be updated must always have an `id` attribute.
:::

### `history`

- Type: `boolean`
- Default: `false`

Use this options to update the browser's history when performing a request. The [`historyPush` function](https://js-toolkit.studiometa.dev/utils/history/historyPush.html#historypush) will be used in the background.

### `requestInit`

- Type: [`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit)
- Default: `{}`

Use this option to customize the options for the fetch request.

```html
<a href="/path" data-component="Fetch" data-option-request-init='{ "priority": "hight" }'>Fetch</a>
```

### `headers`

- Type: `Record<string, string>`
- Default: `{}`

Use this option to add custom headers to the fetch request.

```html
<a href="/path" data-component="Fetch" data-option-headers='{ "authorization": "Basic ..." }'>
  Fetch
</a>
```

### `viewTransition`

- Type: `Boolean`
- Default: `true`

Use this option to disable support for the [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API).

```html
<a href="/path" data-component="Fetch" data-option-no-view-transition>
  Fetch
</a>
```

## Getters

### `client`

- Return: `typeof fetch`

Returns the global `fetch` function.

### `url`

- Return: `URL`

If the root element is a link, returns the `href` attribute, if it is a form, returns the `action` attribute, with the form data as URL parameters if the [`method`](#method) is `get`

### `requestInit`

- Return: [`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit)

Returns the [`requestInit` option](#requestinit) with additionnal headers from the [`headers` option](#headers) [`headers[]` refs](./js-api.md#headers-1) and if the root element is a form with a `method="post"` attribute, its data as body

## Refs

### `headers[]`

- Type: `HTMLInputElement[]`

The `headers[]` refs can be used to add additional headers to the request with `<input type="hidden">` elements.

To avoid adding the header to the form data, use the `data-name` attribute to specify the name of the header.

```html
<form data-component="Fetch">
  <input
    data-ref="headers[]"
    data-name="x-my-token"
    value="some-not-sensible-token"
    type="hidden" />
</form>
```

The example above will add a `x-my-token: some-not-sensible-token` header to the triggered request.

## Methods

### `abort(reason?: any)`

Abort the current request.

**Parameters**

- `reason` (`any`): the reason why the operation was aborted

::: tip
Using an `Error` instance as the `reason` parameter of the `abort(reason?: any)` method will trigger the [`fetch-error` event](#fetch-error) along the [`fetch-abort` event](#fetch-abort).
:::

## Events

All events from the `Fetch` component bubble up the DOM tree, so they can be listened to from any parent element.

### `fetch-before`

Emitted before the fetch request is sent.

**Payload**

- `ctx` (`Object`): context for the event with the following properties
  - `instance` (`Fetch`): the `Fetch` instance emitting the event
  - `url` (`URL`): the URL that will be fetched
  - `requestInit` ([`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit)): options for the `fetch` call

### `fetch-fetch`

Emitted when the fetch request is sent.

**Payload**

- `ctx` (`Object`): context for the event with the following properties
  - `instance` (`Fetch`): the `Fetch` instance emitting the event
  - `url` (`URL`): the URL that will be fetched
  - `requestInit` ([`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit)): options for the `fetch` call

### `fetch-response`

Emitted when the fetch request returned a response, before extracting its body, and before throwing if `response.ok !== true`.

**Payload**

- `ctx` (`Object`): context for the event with the following properties
  - `response` (`Response`): the `Response` object returned by the `fetch` request
  - `instance` (`Fetch`): the `Fetch` instance emitting the event
  - `url` (`URL`): the URL that will be fetched
  - `requestInit` ([`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit)): options for the `fetch` call

### `fetch-after`

Emitted after the fetch request is finished, wether it is successful or not.

**Payload**

- `ctx` (`Object`): context for the event with the following properties
  - `instance` (`Fetch`): the `Fetch` instance emitting the event
  - `url` (`URL`): the URL that was fetched
  - `requestInit` ([`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit)): options for the `fetch` call
  - `content` (`string | void`): the content of the response if the request succeeded

### `fetch-update-before`

Emitted before the DOM is updated.

**Payload**

- `ctx` (`Object`): context for the event with the following properties
  - `instance` (`Fetch`): the `Fetch` instance emitting the event
  - `url` (`URL`): the URL that was fetched
  - `requestInit` ([`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit)): options for the `fetch` call
  - `content` (`string`): the content of the response

### `fetch-update`

Emitted when the DOM is updated.

**Payload**

- `ctx` (`Object`): context for the event with the following properties
  - `instance` (`Fetch`): the `Fetch` instance emitting the event
  - `url` (`URL`): the URL that was fetched
  - `requestInit` ([`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit)): options for the `fetch` call
  - `document` (`Document`): the content of the response, parsed with a [DOMParse](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser)

### `fetch-update-after`

Emitted when the DOM has been updated.

**Payload**

- `ctx` (`Object`): context for the event with the following properties
  - `instance` (`Fetch`): the `Fetch` instance emitting the event
  - `url` (`URL`): the URL that was fetched
  - `requestInit` ([`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit)): options for the `fetch` call
  - `document` (`Document`): the content of the response, parsed with a [DOMParse](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser)

### `fetch-error`

Emitted when the fetch request failed.

**Payload**

- `ctx` (`Object`): context for the event with the following properties
  - `instance` (`Fetch`): the `Fetch` instance emitting the event
  - `url` (`URL`): the URL that was fetched
  - `requestInit` ([`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit)): options for the `fetch` call
  - `error` (`Error`): the error object thrown by the failing request

### `fetch-abort`

Emitted when the fetch request has been aborted.

**Payload**

- `ctx` (`Object`): context for the event with the following properties
  - `instance` (`Fetch`): the `Fetch` instance emitting the event
  - `url` (`URL`): the URL that was fetched
  - `requestInit` ([`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit)): options for the `fetch` call
  - `reason` (`any`): the reason the request was aborted

