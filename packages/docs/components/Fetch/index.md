---
badges: [JS]
---

# Fetch <Badges :texts="$frontmatter.badges" />

The `Fetch` component can be used to add AJAX capabilities to your existing HTML, with support for the [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) for smooth transitions between states.

## Table of content

- [Examples](./examples.md)
- [JS APIs](./js-api.md)

## Usage

The `Fetch` component can be used to perform GET or POST requests without reloading the page.

```js twoslash
import { registerComponent } from '@studiometa/js-toolkit';
import { Fetch } from '@studiometa/ui';

registerComponent(Fetch);
```

### Basic

Given the following HTML:

```html
<a data-component="Fetch" href="/some-content">Click me</a>

<div id="content"></div>
```

And the following response from the `/some-content` endpoint:

<!-- prettier-ignore-start -->
```html
<div id="content">
  Lorem ipsum dolor sit amet, consectetur adipisicing elit.
</div>

Some extra content.
```
<!-- prettier-ignore-end -->

Clicking on the link will dispatch a background fetch request and will replace the `<div id="content"></div>` element with the new content from the fetch response. The page will have the following HTML after:

<!-- prettier-ignore-start -->
```html
<a data-component="Fetch" href="/some-content">Click me</a>

<div id="content">
  Lorem ipsum dolor sit amet, consectetur adipisicing elit. <!-- [!code ++] -->
</div>
```
<!-- prettier-ignore-end -->

::: warning 💡 Important
We use `id` attributes to detect which content from the response should be used and injected in the DOM. Any content from the response not nested in a parent with an `id` attribute will be discarded.
:::

### With a loader

Use the [`Action`](../Action/index.md) and [`Transition`](../Transition/index.md) components to display a loader while the fetch request is happening.

::: code-group

```html [index.html]
<a
  href="/"
  data-component="Fetch Action"
  data-option-history
  data-on:before-fetch="Transition(#foo) -> transition.enter()"
  data-on:after-fetch="Transition(#foo) -> transition.leave()"
  data-on:fetch-error="alert('error')">
  Click me
</a>

<div
  data-component="Transition"
  data-option-enter-from="opacity-0"
  data-option-leave-to="opacity-0"
  class="opacity-0"
  id="foo">
  Loading...
</div>

<div id="content"></div>
```

```js twoslash [app.ts]
import { registerComponent } from '@studiometa/js-toolkit';
import { Action, Fetch, Transition } from '@studiometa/ui';

registerComponent(Action);
registerComponent(Fetch);
registerComponent(Transition);
```

:::

#### Global loader

The [events](./js-api.md#events) sent by the `Fetch` component are configured to be bubbling up the DOM tree when dispatched. This means that the `Action` component can be placed on a parent of the element where the `Fetch` component is configured.

```html
<main
  data-component="Action"
  data-on:before-fetch="Transition(#fetch-loader) -> target.enter()"
  data-on:after-fetch="Transition(#fetch-loader) -> target.leave()">
  ... ...
  <a data-component="Fetch" href="/page/2">Next page</a>
  ... ...
</main>

<div
  data-component="Transition"
  data-option-enter-from="hidden"
  data-option-leave-to="hidden"
  data-option-leave-keep
  class="hidden"
  id="fetch-loader">
  Loading...
</div>
```

### Transitions

The `Fetch` component is compatible with the [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) in compatible browsers. By default, the browser will chose which transition to use between the two states of the DOM. If you want more fine-grained transition, use the [View Transition CSS APIs](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API#css_additions).

```css [app.css]
::view-transition-old(root) {
  animation: transition-out 1s ease-in-out;
}

::view-transition-new(root) {
  animation: transition-in 1s ease-in-out;
}

@keyframes transition-out {
  to {
    opacity: 0;
  }
}

@keyframes transition-in {
  from {
    opacity: 0;
  }
}
```

::: tip Disabling View Transitions
You can disable view transitions with the [`data-option-no-view-transition` attribute](./js-api.md#viewtransition).
:::

### Error handling

The `Fetch` components catches request errors and emits a [`fetch-error` event](./js-api.md#fetch-error) which can be used to display meaningful information.

::: code-group

<!-- prettier-ignore-start -->
```html [index.html] {3}
<main
  data-component="Action"
  data-on:fetch-error="alert(event.detail[0].error)">
  <a href="/" data-component="Fetch">Home</a>
</main>
```
<!-- prettier-ignore-end -->

```js twoslash [app.ts]
import { registerComponent } from '@studiometa/js-toolkit';
import { Action, Fetch } from '@studiometa/ui';

registerComponent(Action);
registerComponent(Fetch);
```

:::

See the [error handling example](./examples.md#error-handling) for detailed usage.

### Cancelling a request

The [`abort` method](./js-api.md#abort-reason-any) can be used to cancel a pending request.

::: code-group

<!-- prettier-ignore-start -->
```html [index.html] {3,7-8}
<main
  data-component="Action"
  data-on:fetch-abort="alert('Request was aborted')">
  <a href="/" data-component="Fetch">Home</a>

  <button
    data-component="Action"
    data-on:click="Fetch -> target.abort()">
    Cancel request
  </button>
</main>
```
<!-- prettier-ignore-end -->

```js twoslash [app.ts]
import { registerComponent } from '@studiometa/js-toolkit';
import { Action, Fetch } from '@studiometa/ui';

registerComponent(Action);
registerComponent(Fetch);
```

:::


See the [cancelling a request example](./examples.md#cancelling-a-request) for detailed usage.

### Handling JSON response

If you need to fetch an API whose content-type is `application/json`, you can use the [`data-option-response` option](./js-api.md#response) to extract the content that will be inserted in the DOM from the JSON object.

::: code-group

<!-- prettier-ignore-start -->
```html [index.html] {3-4}
<form
  action="/api/msg"
  data-component="Fetch"
  data-option-response="response.json().then((data) => data.rendered)">
  <input type="text" name="msg" value="Hello world!">
  <button type="submit">
    Submit
  </button>
</form>

<div id="content">...</div>
```
<!-- prettier-ignore-end -->

```json [/api/msg]
{
  "rendered": "<div id=\"content\">Hello world!</div>"
}
```

```ts [app.ts] twoslash
import { registerComponent } from '@studiometa/js-toolkit';
import { Fetch } from '@studiometa/ui';

registerComponent(Fetch);
```

:::
