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

Updates the browser's history when performing a request. The [`historyMode` option](#historymode) picks between the `historyPush` and `historyReplace` utilities from [`@studiometa/js-toolkit`](https://js-toolkit-v4.studiometa.dev), which write the [`historyUrl`](#historyurl).

The component also listens for `popstate` while this option is on, so a back or forward navigation re-fetches the restored entry and updates the same regions.

### `historyMode`

- Type: `'push' | 'replace'`
- Default: `'push'`

Picks the history writer, when the [`history` option](#history) is on.

- `push` adds one entry per update, so every update is one back press away.
- `replace` overwrites the current entry, so no update adds one.

Use `replace` for a control that fires often — a live search, a facet list, a map — where one entry per keystroke buries the page the visitor came from.

```html
<form
  action="/help"
  method="get"
  data-component="Fetch"
  data-option-src="/apps/search?view=fragment"
  data-option-history
  data-option-history-mode="replace">
  <input type="search" name="q" />
</form>
```

Neither writer runs for an update `popstate` triggered: the entry being restored is already the current one.

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

The separation holds on a back or forward navigation too: the request is rebuilt against `src` rather than aimed at the displayed page. See [`historyUrl`](#historyurl).

## Getters

### `client`

- Return: `typeof fetch`

Returns the global `fetch` function.

### `url`

- Return: `URL`

Resolves the request URL. The base is the [`src` option](#src) when it is set, otherwise the element's own destination: a link's `href`, a form's `action`, or the current location as a last resort. For a form with `method="get"`, the form data is then folded onto that base as URL parameters.

Folding replaces what the base URL carried under the same name, and keeps every value a name carries. So a fixed query in `src` survives alongside the live fields, a field of the same name overrides it, and a control with several values — a checkbox group, a `<select multiple>` — sends all of them:

```html
<!-- ?genre=rock&genre=jazz&section=results -->
<form
  action="/search"
  method="get"
  data-component="Fetch"
  data-option-src="/search/suggest?genre=stale&section=results">
  <input type="checkbox" name="genre" value="rock" checked />
  <input type="checkbox" name="genre" value="jazz" checked />
</form>
```

### `historyUrl`

- Return: `URL`

Resolves the URL the address bar should show, which is not always the one that was requested. The [`src` option](#src) says _what to request_; this says _what the navigation is_.

Without `src` the two are identical. With it, history follows the element's own destination — a link's `href`, a form's `action` folded with its form data — so a lighter endpoint can serve the request without leaking into the URL a visitor copies:

```html
<a
  href="/projects/page/2?orderby=title"
  data-component="Fetch"
  data-option-history
  data-option-src="/projects/page/2?orderby=title&sections=listing">
  2
</a>
```

Clicking that requests the `sections=listing` URL and pushes `/projects/page/2?orderby=title`.

A URL passed explicitly to [`fetch(url)`](#fetch-url-url-string-requestinit-requestinit-context-fetchrequestcontext) is pushed as given: a caller that named a URL meant that URL.

The `historyMode` option picks how that URL is written — one entry per update, or none. See [`historyMode`](#historymode).

#### On back and forward navigation

A `popstate` rebuilds the request the same way, from the entry being restored instead of from the live controls:

- the destination is the restored entry, which the address bar already shows;
- the request URL is still the [`src`](#src) when one is set, with its fixed parameters intact;
- the restored entry's search parameters replace the form fields, which still hold whatever the visitor last typed.

So the entry `/help?q=shipping`, restored on the form of the [`historyMode` option](#historymode), requests `/apps/search?view=fragment&q=shipping`. The response is what brings the controls back in line.

::: tip
Keep the [`selector`](#selector) matching elements that exist in **both** responses — the full page and the lighter endpoint — or the two directions will not update the same regions.
:::

### `requestInit`

- Return: [`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit)

Returns the [`requestInit` option](#requestinit) with the headers of the [`headers` option](#headers) and the [`headers[]` refs](#headers-1), and, when the root element is a form, its method — plus its data as the body when that method is `post`.

The body follows the form's `enctype`, as a native submission does: `application/x-www-form-urlencoded` by default, a `FormData` for `multipart/form-data`, plain text for `text/plain`.

This getter describes a request with no submission behind it. A `submit` event builds the same parts from its submitter as well; see [form submissions](#form-submissions).

## Form submissions

An intercepted submission sends what a native one would send, the button that caused it included.

- The submitter is a successful control: `<button type="submit" name="page" value="2">` puts `page=2` in the request, and two buttons of the same name each send their own value.
- `formaction` overrides the form's `action` for that submission, so it overrides the destination and the URL written to history.
- `formmethod` overrides the form's `method`, moving the fields between the URL and the body.
- `formenctype` overrides the form's `enctype`, choosing how the body is encoded.
- Repeated names keep every value, and the usual successful-control rules apply.

```html
<form action="/projects" method="get" data-component="Fetch">
  <input type="hidden" name="orderby" value="title" />
  <button type="submit" name="page" value="1">1</button>
  <button type="submit" name="page" value="2">2</button>
</form>
```

Pressing the second button requests `/projects?orderby=title&page=2`, with no script of its own.

The submitter belongs to the submission that carried it: a later [`fetch()`](#fetch-url-url-string-requestinit-requestinit-context-fetchrequestcontext) call, and a back or forward navigation, build their request without it.

### File controls

The effective enctype decides what a file control sends. `multipart/form-data` sends the file. Every other encoding sends the file's name, as a native submission does, and no GET submission uploads a file whatever the form declares.

A form that declares no `enctype` sends `application/x-www-form-urlencoded`, so a file control in it sends a name and not a file. `Fetch` reports that case on the diagnostic channel under the `fetch.file-not-uploaded` code. Declare `enctype="multipart/form-data"` on the form, or `formenctype="multipart/form-data"` on the submitter, to send the file itself.

```html
<form action="/upload" method="post" enctype="multipart/form-data" data-component="Fetch">
  <input type="file" name="photo" />
  <button type="submit">Upload</button>
</form>
```

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

### `fetch(url?: URL | string, requestInit?: RequestInit, context?: FetchRequestContext)`

Performs the fetch request and updates the DOM with the response.

The declarative click, submit and popstate flows call this method for you, but it can also be triggered manually — from an event, a decorator or your own code.

**Parameters**

- `url` (`URL | string`, optional): the URL to fetch. Defaults to the [`url` getter](#url), so a bare `fetch()` call uses the element's `href`, `action` or [`src` option](#src). A `string` is coerced into a `URL` resolved against the current location.
- `requestInit` ([`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit), optional): extra options merged into the [`requestInit` getter](#requestinit-1) for this call.
- `context` (`FetchRequestContext`, optional): what this one request overrides on the element it is built from — a `submitter` for [a form submission](#form-submissions), a `restoredUrl` for a back or forward navigation. The declarative flows fill it in; it is never kept on the instance, so nothing leaks into the next request.

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

## Diagnostics

Every one is a development-only warning on the [toolkit diagnostic channel](https://js-toolkit-v4.studiometa.dev/).

| Code                      | Meaning                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `fetch.file-not-uploaded` | A file control is sent as its filename because the effective enctype is not multipart. |

## Events

All events from the `Fetch` component bubble up the DOM tree, so they can be listened to from any parent element.

### The event detail

Every `fetch-*` event carries a detail of the same shape, holding the fields known at that point in the lifecycle. `event.detail` **is** that object, so a listener reads a field by path with nothing to unwrap.

```ts
interface FetchLifecycleDetail {
  instance: Fetch;
  request: {
    url: string;
    method: string;
    searchParams: Record<string, string[]>;
  };
  response?: {
    url: string;
    status: number;
    statusText: string;
    ok: boolean;
    redirected: boolean;
    headers: Record<string, string>;
  };
  content?: string;
  fragment?: Document;
}
```

- `instance` (`Fetch`): the `Fetch` instance emitting the event.
- `request.url` (`string`): the absolute URL the request is sent to.
- `request.method` (`string`): the HTTP method, uppercase.
- `request.searchParams` (`Record<string, string[]>`): the query, with every value each name carries. A repeated name — a checkbox group, a `<select multiple>` — keeps all of its values, which is why each name maps to a list.
- `response` (`object`): the response description, present once the request has returned one.
- `response.headers` (`Record<string, string>`): the response headers, names lowercase.
- `content` (`string`): the string extracted from the response body by the [`response` option](#response), present once the body has been read.
- `fragment` (`Document`): `content` parsed with a [`DOMParser`](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser), present once the update starts.

Three events add one field of their own: [`fetch-after`](#fetch-after) and [`fetch-error`](#fetch-error) carry `error`, [`fetch-abort`](#fetch-abort) carries `reason`.

Everything except `instance` and `fragment` is plain data — no `URL`, no `Headers`, no `RequestInit`, no getters — so a declarative consumer resolves any field by path, with nothing to import:

<!-- prettier-ignore-start -->
```html
<main
  data-component="Action"
  data-on:fetch-update-after="console.log(event.detail.response.headers['x-search-result-count'])">
  <form action="/search" method="get" data-component="Fetch">
    <input type="search" name="q" />
  </form>
</main>
```
<!-- prettier-ignore-end -->

`response` describes the response, it is not the [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response). A body reads once, and the component reads it to produce `content`, so the object itself is never handed to listeners: one of them consuming the body would leave the component with nothing to inject.

### Event order

A successful request emits, in this order:

| Order | Event                                         | Detail added     |
| ----- | --------------------------------------------- | ---------------- |
| 1     | [`fetch-before`](#fetch-before)               | `request`        |
| 2     | [`fetch-fetch`](#fetch-fetch)                 |                  |
| 3     | [`fetch-response`](#fetch-response)           | `response`       |
| 4     | [`fetch-after`](#fetch-after)                 | `content`        |
| 5     | [`fetch-update-before`](#fetch-update-before) |                  |
| 6     | [`fetch-update`](#fetch-update)               | `fragment`       |
| 7     | [`dom-update`](#dom-update)                   | _protocol event_ |
| 8     | [`fetch-update-after`](#fetch-update-after)   |                  |

The promise returned by [`fetch()`](#fetch-url-url-string-requestinit-requestinit-context-fetchrequestcontext) resolves after `fetch-update-after`, so awaiting it means every swap has settled.

A failed request replaces steps 4 to 8 with `fetch-after` carrying `error` instead of `content`, then [`fetch-error`](#fetch-error). `fetch-response` is emitted only when a response came back, so a network failure goes straight from `fetch-fetch` to `fetch-after`.

A failed update — a rejected swap, a rejected [`dom-update`](#the-dom-update-protocol-event) runner — emits `fetch-error` in place of `fetch-update-after`, carrying the `content` and the `fragment` it was applying. It does not emit a second `fetch-after`: the request succeeded, the update did not.

[`fetch-abort`](#fetch-abort) is emitted whenever the request in flight is aborted, which happens when a new request starts on the same instance or when [`abort()`](#abort-reason-any) is called.

### `fetch-before`

Emitted before the fetch request is sent.

**Detail**

- `instance`, `request`.

### `fetch-fetch`

Emitted when the fetch request is sent.

**Detail**

- `instance`, `request`.

### `fetch-response`

Emitted when the fetch request returned a response, before extracting its body, and before throwing if `response.ok !== true`.

**Detail**

- `instance`, `request`, `response`.

### `fetch-after`

Emitted after the fetch request is finished, whether it is successful or not.

**Detail**

- `instance`, `request`, `response` when a response came back, and either `content` when the request succeeded or `error` when it failed.

### `fetch-update-before`

Emitted before the DOM is updated.

**Detail**

- `instance`, `request`, `response`, `content`.

### `fetch-update`

Emitted when the DOM is updated.

**Detail**

- `instance`, `request`, `response`, `content`, `fragment`.

### `dom-update`

Emitted after the [`fetch-update` event](#fetch-update), right before the fetched content is applied to the DOM. Unlike the `fetch-*` events, this is a shared protocol event announcing an imminent DOM change — see [the `dom-update` protocol event](#the-dom-update-protocol-event).

**Detail**

The event `detail` carries the same fields as `fetch-update`, plus the one the protocol is made of:

- `wrap` (`(runner: DomUpdateRunner) => void`): registers a runner or transitioner that substitutes the default update path

### `fetch-update-after`

Emitted when the DOM has been updated and every swap has settled.

**Detail**

- `instance`, `request`, `response`, `content`, `fragment`.

### `fetch-error`

Emitted when the fetch request failed, or when the DOM update failed.

**Detail**

- `instance`, `request`, everything the lifecycle had learned when it failed, and:
  - `error` (`Error`): the error thrown by the failing request or the failing update

A failed request carries `response` when one came back and nothing else: there was no content to apply. A failed update carries `response`, `content` and `fragment`, which is what was being applied when it failed.

### `fetch-abort`

Emitted when the fetch request has been aborted.

**Detail**

- `instance`, `request`, and:
  - `reason` (`any`): the reason the request was aborted

## The `dom-update` protocol event

Before applying the fetched content, `Fetch` dispatches the bubbling [`dom-update` event](#dom-update) announcing the imminent DOM change. Because it bubbles, any ancestor can listen for it and call `event.detail.wrap(runnerOrTransitioner)` to substitute the runner that applies the fetched content — instead of the default [View Transition](#viewtransition) or direct update — and drive the swap with its own choreography, similar to Turbo's `turbo:before-render` render substitution.

`wrap()` accepts a `DomUpdateRunner`, which is either form:

- a **function** with the signature `(apply: () => void) => void | Promise<unknown>`: it receives an `apply` function that injects the fetched content into the DOM, and its return value is awaited before the [`fetch-update-after` event](#fetch-update-after) is emitted
- a **transitioner**: any duck-typed object with an `update(mutate)` method (the `DomUpdateTransitioner` interface), e.g. [`MotionView`](/reference/items/MotionView/) from `@studiometa/ui-motion` — its `update()` method receives the apply function and its return value is awaited the same way

The protocol enforces three rules:

- **Synchronous registration only**: `wrap` must be called synchronously while the event dispatches — later calls warn and are ignored.
- **Last call wins**: a single runner is kept, the last `wrap` call during dispatch replaces any previous one.
- **The content is never lost**: if the runner throws or rejects, the error is logged with a warning and the content is applied directly when it has not been applied yet. The `fetch-update-after` event is always emitted.

With the [ambient `MotionView`](/reference/items/MotionView/js-api#ambient-wiring) from `@studiometa/ui-motion`, the common case is pure nesting: a `MotionView` wrapping the updated content picks up the bubbling event by itself, with no attributes to write. When the transitioner lives elsewhere in the tree, an [Action](/reference/items/Action/) is the explicit escape hatch to route the event to it:

```html
<div data-component="Action" data-on:dom-update="MotionView(#list)->event.detail.wrap(target)">
  <ul id="list">
    …
  </ul>
  <a href="/page/2" data-component="Fetch">Next page</a>
</div>
```
