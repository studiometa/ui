---
title: FrameForm
---

# FrameForm

The `FrameForm` component extends the [abstract `AbstractFrameTrigger` component](./abstract-frame-trigger.md) and inherits from its APIs.

It will trigger a request on its parent [`Frame` component](./frame.md) when its root `<form>` element is submitted, if the target attribute of the form is not `_blank`.

## Getters

### `method`

- Return: `'post' | 'get'`
- Default: the `method` attribute of the `<form>` used as root element

### `url`

- Return: `URL`
- Default: the `action` attribute with the form data as URL parameters if the [`method`](#method) is `get`

### `requestInit`

- Return: `RequestInit`
- Default: the parent `requestInit` with additionnal headers from the [`headers[]` refs](@todo) and the form data as body if the [`method`](#method) is `post`

## Refs

### `headers[]`

- Type: `HTMLInputElement[]`

The `headers[]` refs can be used to add additional headers to the request with `<input type="hidden">` elements.

To avoid adding the header to the form data, use the `data-name` attribute to specify the name of the header.

```html
<form data-component="FrameForm">
  <input
    data-ref="headers[]"
    data-name="x-my-token"
    value="some-not-sensible-token"
    type="hidden" />
</form>
```

The example above will add a `x-my-token: some-not-sensible-token` header to the triggered request.
