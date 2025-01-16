# Frame <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/Frame/package.json';
  const badges = [`v${pkg.version}`, 'JS'];
</script>

## Table of content

- [Examples](./examples)
- [JS API](./js-api)

## Usage
The `Frame` component and it's children `FrameForm`, `FrameTarget`, `FrameAnchor` are used to perform GET or POST requests without reloading the page.

### Frame
Orchestrate the mechanic of request handling, caching, updating the browser history, etc.
The component **must-have** an `id` attribute. The component only work with it's children `FrameForm`, `FrameTarget`, `FrameAnchor`.

```html
<div data-component="Frame" id="my-frame">
  <a data-component="FrameAnchor" href="https://www.domain.com?param1=foo&param2=bar">My foo bar link</a>
  <form data-component="FrameForm" action="https://..." method="GET">
    <!-- ... -->
  </form>
  <div data-component="FrameTarget" id="my-target">
    <!-- ... -->
  </div>
</div>
```

### FrameForm
The component should **only be used on a `HTMLFormElement`** and need to have both `action` and `method` attributes.
The action attribute is where the fetch request will be send to, the method attribute indicate if the request should be a `GET` or a `POST` request.

```html
<form data-component="FrameForm" action="https://..." method="GET">
<!-- my code -->
</form>
```
**All inputs inside the `FrameForm` with be send along with the request.**

```html For GET
<form data-component="FrameForm" action="https://www.domain.com" method="GET">
  <input type="text" name="firstname" value="Jean-Claude">
  <input type="text" name="lastname" value="Van Damme">
  <!-- will send the request
  https://www.domain.com?firstname=Jean-Claude&lastname=Van Damme
  -->
</form>
```


### FrameTarget
This component indicate which part of the document should be updated once the request is performed. Only content inside a `FrameTarget` will change when a request is done.
It's good pratice to add an `id` for each `FrameTarget`
```html
<div data-component="FrameTarget" id="my-target">
  <!-- My code inside this component be updated on each request perform by the parent Frame component -->
</div>
```

### FrameAnchor
This component is used to send request via URL links.
This component should **only be used on `HTMLAnchorlement`**

```html
<a data-component="FrameAnchor" href="https://www.domain.com?param1=foo&param2=bar">My foo bar link</a>
```

When clicking on this `FrameAnchor` a fetch request, will be send using this `href` attribute and GET attributes `param1` and `params2` will be send as well.
