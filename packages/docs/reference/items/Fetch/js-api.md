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

Specifies which content from the response should be updated in the DOM. This option can be any valid CSS selector.

::: warning ⚠️ Matching with ID
This option can be used to extract specific content from the response, but the matching between the current DOM and the new DOM is still made based on `id` attributes. This means that elements that should be updated must always have an `id` attribute.
:::

### `history`

- Type: `boolean`
- Default: `false`

Updates the browser's history when performing a request. The [`historyPush` function](https://js-toolkit.studiometa.dev/utils/history/historyPush.html#historypush) will be used in the background.

### `requestInit`

- Type: [`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit)
- Default: `{}`

Customizes the options for the fetch request.

```html
<a href="/path" data-component="Fetch" data-option-request-init='{ "priority": "high" }'>Fetch</a>
```

### `headers`

- Type: `Record<string, string>`
- Default: `{}`

Adds custom headers to the fetch request.

```html
<a href="/path" data-component="Fetch" data-option-headers='{ "authorization": "Basic ..." }'>
  Fetch
</a>
```

### `viewTransition`

- Type: `boolean`
- Default: `true`

Wrap the content update in a [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API), through the same [`viewTransition` scheduler](/reference/items/ViewTransition/) as every other component — updates requested in the same tick are batched into one transition and batches are serialized, so a `Fetch` swap never fights a [`Toaster`](/reference/items/Toaster/) or [`ViewTransition`](/reference/items/ViewTransition/) animation over the one-transition-per-document limit. Falls back to a direct update when the API is unavailable. Disable it with `data-option-no-view-transition`.

```html
<a href="/path" data-component="Fetch" data-option-no-view-transition>Fetch</a>
```

### `response`

- Type: `string`
- Default: `response.text()`

Customizes how the response's body is parsed.

This option is useful when you do not have control over an API and need to extract HTML content from an `application/json` response.

::: code-group

```html [form.html] {3}
<form
  data-component="Fetch"
  data-option-response="response.json().then((data) => data.rendered_content)"
  action="/api/json">
  <button type="submit">Submit</button>
</form>

<!--
The following element will be updated with HTML from the
`rendered_content` property of the /api/json endpoint.
-->
<div id="content"></div>
```

```json [/api/json]
{
  "status": "ok",
  "rendered_content": "<div id=\"content\">content</div>"
}
```

:::

### `src`

- Type: `string`
- Default: `''`

Defines the URL to fetch. This makes it possible to drive the `Fetch` component from any element (e.g. a `<div>`) triggered by an event, a decorator or a programmatic call.

The value is resolved against the current location, so both absolute and relative URLs are supported. When set, `src` **takes precedence** over the element's own destination: it overrides a `<a>`'s `href` and a `<form>`'s `action`. For a GET `<form>`, the live form data is still folded onto the `src` URL, so a fixed query in `src` (e.g. `?section_id=…`) survives alongside the form fields, with form fields winning on conflict.

```html
<div data-component="Action InView Fetch" data-option-src="/path" data-on:in-view="Fetch.fetch()">
  …
</div>
```

This is handy for progressive enhancement, where the element's native `action`/`href` is the no-JS destination and `src` points the enhanced request at a JS-only endpoint. For example, a search form that submits to a full results page without JS but hits a lighter suggestions endpoint when enhanced:

```html
<form
  action="/search"
  method="get"
  data-component="Fetch"
  data-option-src="/search/suggest?section_id=predictive-search">
  <input type="search" name="q" />
</form>
```

## Getters

### `client`

- Return: `typeof fetch`

Returns the global `fetch` function.

### `url`

- Return: `URL`

Resolves the request URL. The base is the [`src` option](#src) when it is set, otherwise the element's own destination: a link's `href`, a form's `action`, or the current location as a last resort. For a form with `method="get"`, the form data is then folded onto that base as URL parameters (fields set on top, so a fixed query in `src` is preserved).

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

### `fetch(url?: URL | string, requestInit?: RequestInit)`

Performs the fetch request and updates the DOM with the response.

The declarative click, submit and popstate flows call this method for you, but it can also be triggered manually — from an event, a decorator or your own code.

**Parameters**

- `url` (`URL | string`, optional): the URL to fetch. Defaults to the [`url` getter](#url), so a bare `fetch()` call uses the element's `href`, `action` or [`src` option](#src). A `string` is coerced into a `URL` resolved against the current location.
- `requestInit` ([`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit), optional): extra options merged into the [`requestInit` getter](#requestinit-1) for this call.

```html
<div data-component="Action InView Fetch" data-option-src="/path" data-on:in-view="Fetch.fetch()">
  …
</div>
```

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

Emitted after the fetch request is finished, whether it is successful or not.

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

### `dom-update`

Emitted after the [`fetch-update` event](#fetch-update), right before the fetched content is applied to the DOM. Unlike the `fetch-*` events, this is a shared protocol event announcing an imminent DOM change — see [the `dom-update` protocol event](#the-dom-update-protocol-event).

**Detail**

The event `detail` is a bare object (not an argument array) with the following property:

- `wrap` (`(runner: DomUpdateRunner) => void`): registers a runner or transitioner that substitutes the default update path

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

## The `dom-update` protocol event

Before applying the fetched content, `Fetch` dispatches the bubbling [`dom-update` event](#dom-update) announcing the imminent DOM change. Because it bubbles, any ancestor can listen for it and call `event.detail.wrap(runnerOrTransitioner)` to substitute the runner that applies the fetched content — instead of the default [View Transition](#viewtransition) or direct update — and drive the swap with its own choreography, similar to Turbo's `turbo:before-render` render substitution.

`wrap()` accepts a `DomUpdateRunner`, which is either form:

- a **function** with the signature `(apply: () => void) => void | Promise<unknown>`: it receives an `apply` function that injects the fetched content into the DOM, and its return value is awaited before the [`fetch-update-after` event](#fetch-update-after) is emitted
- a **transitioner**: any duck-typed object with an `update(mutate)` method (the `DomUpdateTransitioner` interface), e.g. `MotionView` from `@studiometa/ui-motion` — its `update()` method receives the apply function and its return value is awaited the same way

The protocol enforces three rules:

- **Synchronous registration only**: `wrap` must be called synchronously while the event dispatches — later calls warn and are ignored.
- **Last call wins**: a single runner is kept, the last `wrap` call during dispatch replaces any previous one.
- **The content is never lost**: if the runner throws or rejects, the error is logged with a warning and the content is applied directly when it has not been applied yet. The `fetch-update-after` event is always emitted.

With the upcoming ambient `MotionView` from `@studiometa/ui-motion`, the common case is pure nesting: a `MotionView` wrapping the updated content picks up the bubbling event by itself, with no attributes to write. When the transitioner lives elsewhere in the tree, an [Action](/reference/items/Action/) is the explicit escape hatch to route the event to it:

```html
<div data-component="Action" data-on:dom-update="MotionView(#list)->event.detail.wrap(target)">
  <ul id="list">
    …
  </ul>
  <a href="/page/2" data-component="Fetch">Next page</a>
</div>
```
