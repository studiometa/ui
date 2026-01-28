---
title: Track JS API
---

# JS API

## Options

### `threshold`

- Type: `number`
- Default: `0.5`

The IntersectionObserver threshold used for the `view` event. A value of `0.5` means the tracking will trigger when 50% of the element is visible.

```html
<div
  data-component="Track"
  data-option-threshold="0.8"
  data-on:view.once='{"event": "product_impression"}'>
  Product Card
</div>
```

## Events

Events are defined using the `data-on:<event>[.<modifier>]` syntax with a JSON payload.

### DOM Events

Any DOM event can be tracked: `click`, `submit`, `change`, `input`, `focus`, `blur`, `scroll`, `mouseenter`, `mouseleave`, etc.

```html
<button data-component="Track" data-on:click='{"event": "cta_click", "location": "header"}'>
  Subscribe
</button>
```

### Special Events

#### `mounted`

Dispatches tracking data immediately when the component mounts. Useful for page load data like ecommerce views.

```html
<div
  data-component="Track"
  data-on:mounted='{"event": "view_item_list", "ecommerce": {"items": [...]}}'
  hidden></div>
```

#### `view`

Uses IntersectionObserver for impression tracking. The event fires when the element becomes visible based on the `threshold` option.

```html
<div data-component="Track" data-on:view.once='{"event": "product_impression", "id": "123"}'>
  Product Card
</div>
```

## Event Modifiers

Modifiers can be chained using `.` as a separator:

```html
<a href="/product" data-component="Track" data-on:click.prevent.once='{"event": "select_item"}'>
  View Product
</a>
```

### Available Modifiers

| Modifier       | Effect                                                       |
| -------------- | ------------------------------------------------------------ |
| `.prevent`     | Calls `event.preventDefault()`                               |
| `.stop`        | Calls `event.stopPropagation()`                              |
| `.once`        | Track only once (removes listener after first trigger)       |
| `.passive`     | Registers a passive event listener                           |
| `.capture`     | Registers the listener in capture phase                      |
| `.debounce`    | Debounces the handler with a 300ms delay                     |
| `.debounce<N>` | Debounces with custom delay (e.g., `.debounce500` for 500ms) |
| `.throttle`    | Throttles the handler with a 16ms delay (~60fps)             |
| `.throttle<N>` | Throttles with custom delay (e.g., `.throttle100` for 100ms) |

### Timing Modifiers Examples

```html
<!-- Debounce search input (default 300ms) -->
<input data-component="Track" data-on:input.debounce='{"event": "search_input"}' />

<!-- Debounce with custom delay -->
<input data-component="Track" data-on:input.debounce500='{"event": "search_input"}' />

<!-- Throttle scroll tracking (default 16ms ~60fps) -->
<main data-component="Track" data-on:scroll.throttle.passive='{"event": "scroll_tracking"}'>
  <!-- Throttle with custom delay -->
  <div data-component="Track" data-on:mousemove.throttle100='{"event": "mouse_position"}'></div>
</main>
```

## Custom Events

The Track component can listen to CustomEvents dispatched by other scripts.

### Using `$detail.*` Placeholders

Extract specific values from `event.detail` using the `$detail.*` syntax:

```html
<form
  data-component="Track"
  data-on:form-submitted='{"event": "form_submitted", "email": "$detail.email", "name": "$detail.user.name"}'></form>
```

If the form dispatches:

```js
element.dispatchEvent(
  new CustomEvent('form-submitted', {
    detail: { email: 'test@example.com', user: { name: 'John' } },
  }),
);
```

The tracking data will be:

```json
{ "event": "form_submitted", "email": "test@example.com", "name": "John" }
```

## TrackContext

The `TrackContext` component provides hierarchical context data that is merged into all child `Track` components.

### Options

#### `data`

- Type: `object`
- Default: `{}`

The context data to merge into child Track components.

```html
<section
  data-component="TrackContext"
  data-option-data='{"page_type": "product", "product_id": "123"}'>
  <button data-component="Track" data-on:click='{"action": "add_to_cart"}'>Add to Cart</button>
  <!-- Dispatches: { page_type: "product", product_id: "123", action: "add_to_cart" } -->
</section>
```

### Nested Contexts

When Track is nested in multiple TrackContext components, it uses the data from the **closest parent** only:

```html
<div data-component="TrackContext" data-option-data='{"site": "example.com"}'>
  <section
    data-component="TrackContext"
    data-option-data='{"page": "product", "product_id": "123"}'>
    <button data-component="Track" data-on:click='{"action": "buy"}'>Buy</button>
    <!-- Uses closest context: { page: "product", product_id: "123", action: "buy" } -->
  </section>
</div>
```

## Custom Dispatcher

By default, Track pushes data to `window.dataLayer` (GTM). You can customize the dispatcher:

```js
import { setTrackDispatcher } from '@studiometa/ui';

// Send to GA4 directly
setTrackDispatcher((data, event) => {
  gtag('event', data.event, data);
});

// Send to multiple destinations
setTrackDispatcher((data) => {
  window.dataLayer.push(data);
  fetch('/api/analytics', { method: 'POST', body: JSON.stringify(data) });
});

// Reset to default (dataLayer.push)
setTrackDispatcher(null);
```

## Methods

### `dispatch(data, event?)`

Manually dispatch tracking data. The data is merged with any parent TrackContext data.

```js
import { getInstanceFromElement } from '@studiometa/js-toolkit';
import { Track } from '@studiometa/ui';

const element = document.querySelector('[data-component="Track"]');
const track = getInstanceFromElement(element, Track);
track.dispatch({ event: 'custom_event', value: 123 });
```
