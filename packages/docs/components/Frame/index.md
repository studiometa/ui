---
badges: [JS]
---

# Frame <Badges :texts="$frontmatter.badges" />

## Table of content

- [Examples](./examples.md)
- [JS APIs](./js-api/index.md)
  - [Frame](./js-api/frame.md)
  - [FrameAnchor](./js-api/frame-anchor.md)
  - [FrameForm](./js-api/frame-form.md)
  - [FrameLoader](./js-api/frame-loader.md)
  - [FrameTarget](./js-api/frame-target.md)

## Usage

The `Frame` component and it's children `FrameForm`, `FrameTarget`, `FrameAnchor` and `FrameLoader` can be used to perform GET or POST requests without reloading the page.

### Frame

Orchestrate the mechanic of request handling, updating the browser history, etc. The component **must-have** an `id` attribute. The component only work with it's children `FrameForm`, `FrameTarget`, `FrameAnchor` and `FrameLoader`.

```html
<div data-component="Frame" id="my-frame">
  <div data-component="FrameLoader" data-option-enter-from="hidden" data-option-leave-to="hidden">
    Loading...
  </div>
  <a data-component="FrameAnchor" href="https://fqdn.com?param1=foo&param2=bar">
    My foo bar link
  </a>
  <form data-component="FrameForm" action="https://..." method="GET">
    <!-- ... -->
  </form>
  <div data-component="FrameTarget" id="my-target">
    <!-- ... -->
  </div>
</div>
```

### FrameForm

The `FrameForm` component should **only be used on a `HTMLFormElement`**. It will use the standard `<form>` APIs to send a request:

- the [`action` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form#action) defines the URL
- the [`method` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form#method) defines the method (only `GET` or `POST` methods are supported for now)
- the named `<input>` and other form elements inside the form will be used either as query parameters for `GET` requests or as the request body for `POST` requests

The following example will send a GET request to `https://fqdn.com/my/endpoint?firstname=Jean-Claude&lastname=Van Damme`.

```html
<form data-component="FrameForm" action="https://fqdn.com/my/endpoint" method="GET">
  <input type="text" name="firstname" value="Jean-Claude" />
  <input type="text" name="lastname" value="Van Damme" />
</form>
```

### FrameTarget

This component indicate which part of the document should be updated once the request is performed. Only content inside a `FrameTarget` will change when a request is done.

```html
<div data-component="FrameTarget" id="my-target">
  <!-- My code inside this component be updated on each request perform by the parent Frame component -->
</div>
```

::: warning ❗ Important
The root element of a `FrameTarget` component **must have an `id` attribute**. It is used to map new content to the existing one.
:::

### FrameAnchor

This component is used to send request via URL links.
This component should **only be used on `HTMLAnchorlement`**

```html
<a data-component="FrameAnchor" href="https://fqdn.com?param1=foo&param2=bar">
  My foo bar link
</a>
```

When clicking on this `FrameAnchor` a fetch request, will be send using this `href` attribute and GET attributes `param1` and `params2` will be send as well.

### FrameLoader
