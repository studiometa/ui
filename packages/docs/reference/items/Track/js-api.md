---
title: Track JS API
---

# Track JS API

## Components

| Component      | Destination                                                |
| -------------- | ---------------------------------------------------------- |
| `Track`        | `window.dataLayer.push(payload)` (GTM / GA4)               |
| `TrackShopify` | `window.Shopify.analytics.publish(payload.event, payload)` |
| `TrackContext` | Provides context inherited by descendant `Track`s          |

`Track` and `TrackShopify` share a common, provider-agnostic base (`AbstractTrack`) and differ only in their [`dispatch()`](#providers) method.

## Events

Events are declared with attributes named `data-track:<event>[.modifier…]`. The attribute **value** can be:

- **a bare event name** — the shorthand for the common case, avoiding JSON in HTML:

  ```html
  <button data-track:click="add_to_cart"></button>
  <!-- equivalent to data-track:click='{"event": "add_to_cart"}' -->
  ```

- **a JSON object** — merged into the dispatched payload, with the event name under its `event` key. Use this when a single event needs its own structured data (the payload ref and options are shared by every event on the element):

  ```html
  <button data-track:click='{"event": "cta_click", "location": "header"}'></button>
  ```

- **empty** — the payload then comes entirely from the context, the `payload` ref and/or the `payload` option:

  ```html
  <div data-track:view data-option-payload='{"event": "impression"}'></div>
  ```

Several `data-track:*` attributes can be set on the same element to track independent events.

### Reserved events

| Event     | Behaviour                                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `mounted` | Dispatched once after the component mounts, when the DOM has settled. It carries no event.                                                 |
| `view`    | Dispatched when the element enters the viewport, via `IntersectionObserver` (see the [`threshold`](#options) option). It carries no event. |

`mounted` waits until every pending import and mount has finished, so the context of a `TrackContext` loaded lazily through a manifest is included. A `TrackContext` that waits for a `visible`, `in-view`, `idle`, `interaction` or `media:` mount strategy is not awaited. Rewriting a `data-track:mounted` attribute creates a new declaration, which dispatches again.

Any other name binds a native DOM event (`click`, `mouseenter`, `submit`, a `CustomEvent` type, …).

### Modifiers

| Modifier                      | Effect                                                                      |
| ----------------------------- | --------------------------------------------------------------------------- |
| `.prevent`                    | `event.preventDefault()`                                                    |
| `.stop`                       | `event.stopPropagation()`                                                   |
| `.once`                       | Dispatch at most once (also stops the `view` observer).                     |
| `.passive`                    | Register the listener as passive.                                           |
| `.capture`                    | Register the listener in the capture phase.                                 |
| `.debounce` / `.debounce<ms>` | Debounce the dispatch (default `300`).                                      |
| `.throttle` / `.throttle<ms>` | Throttle the dispatch (default `16`).                                       |
| `.detail`                     | For a `CustomEvent`, merge the whole `event.detail` into the payload, last. |

Example: `data-track:input.debounce500`, `data-track:click.prevent.once`.

## Payload

The dispatched payload is deep-merged from the following sources, in increasing priority:

1. **Inherited context** — from ancestor `TrackContext` components (see below).
2. **Component payload** — shared by every event on the element, from a `<script data-ref="payload" type="application/json">` child and/or a `data-option-payload` attribute (the option overrides the ref on conflicts).
3. **Event payload** — the JSON value of the `data-track:<event>` attribute (or the `event` key when the bare-name shorthand is used).

Later sources win on conflicting keys. **Arrays are replaced, not concatenated**, so a more specific layer fully overrides a list (e.g. GA4 `ecommerce.items`) from a broader one. With the [`.detail`](#modifiers) modifier, the event detail is merged last, on top of the three sources.

All three sources are read when the event fires, never cached at mount. A partial DOM update that rewrites a payload script, a `data-option-payload` attribute or an ancestor `TrackContext` therefore changes what the next dispatch sends, with no remount.

```html
<div
  data-component="Track"
  data-track:click='{"event": "select_item"}'
  data-option-payload='{"currency": "EUR"}'>
  <script data-ref="payload" type="application/json">
    { "list": "search-results" }
  </script>
</div>
```

Malformed JSON (in an attribute value or a `<script>` ref) is skipped safely; a warning is logged when the element has `data-option-log`.

### Event data

A payload value starting with `$event.` or `$detail.` is a placeholder: it is replaced by the value found at that path on the event that triggered the dispatch.

- `$event.<path>` resolves against the whole event, so it reaches native properties as well as a `CustomEvent` detail.
- `$detail.<path>` is the shortcut for `$event.detail.<path>`.

A placeholder works in every source: the event payload, the component payload (script and option) and the inherited context. Placeholders are resolved once the sources are merged. A placeholder is a whole value: a string that only contains one stays as it is, and so does a bare `$event` or `$detail`.

```html
<!-- A CustomEvent detail, written both ways -->
<div data-track:form-submitted='{"event": "lead", "email": "$event.detail.email"}'></div>
<div data-track:form-submitted='{"event": "lead", "email": "$detail.email"}'></div>

<!-- A native event -->
<button
  data-type="cta"
  data-track:click='{"event": "cta_click", "type": "$event.target.dataset.type"}'></button>
```

A path walks objects and arrays, and a numeric segment reads an array index. Placeholders nested inside objects and arrays are resolved too, which is what a GA4 `ecommerce.items` list needs:

```html
<div
  data-track:add-to-cart='{"event": "add_to_cart", "ecommerce": {"items": [{"item_id": "$detail.id"}]}}'></div>
```

A path naming data the event does not carry resolves to `undefined`. So does every placeholder of the `mounted` and `view` events, which carry no event at all.

The resolver knows nothing about who emitted the event, so any component that emits plain data in its detail is readable from markup:

```js
import { Base } from '@studiometa/js-toolkit';

class SearchResults extends Base {
  static config = { name: 'SearchResults' };

  show(results, tags) {
    // Render the results, then announce them with plain data.
    this.$emit('search-results', { count: results.length, tags });
  }
}
```

```html
<div
  data-component="SearchResults Track"
  data-track:search-results='{"event": "search_results", "count": "$event.detail.count", "tag": "$event.detail.tags.0"}'></div>
```

#### Tracking the result of a request

The [`fetch-update-after` event](/reference/items/Fetch/js-api#fetch-update-after) of [`Fetch`](/reference/items/Fetch/) carries the response as plain data, with lower-case header names. A `Track` around the form reads a header of the response that updated the page:

```html
<div
  data-component="Track"
  data-track:fetch-update-after='{"event": "search", "results": "$detail.response.headers.x-search-result-count"}'>
  <form
    action="/search"
    data-component="Fetch"
    data-option-history
    data-option-history-mode="replace">
    <input type="search" name="q" />
  </form>
  <div id="results">…</div>
</div>
```

- Keep the `Track` element outside the regions that `Fetch` swaps. A swapped element is a new element, and its `Track` would not see the event.
- A browser hides the headers of a cross-origin response. When the [`src` option](/reference/items/Fetch/js-api#src) points to another origin, the endpoint must list the header in `Access-Control-Expose-Headers`.
- `$detail.request.destination` gives the URL the address bar shows.

A placeholder is replaced by the value at its path as it is. A path can therefore reach an object that does not serialise to JSON, such as a DOM element (`$event.target`) or a component instance. `Track` pushes it to `window.dataLayer` unchanged. `TrackShopify` hands the payload to `Shopify.analytics.publish()`, which passes it as `customData` to pixels that run in a sandbox. Keep a `TrackShopify` payload JSON-serialisable: point its placeholders to plain values, such as `$event.target.dataset.plan`.

A debounced or throttled event is read when the dispatch runs, after the event has finished. At that time `event.currentTarget` is `null`. Read `$event.target` instead.

The `.detail` modifier is the other way to consume a `CustomEvent`: it merges the whole `event.detail` into the payload. The placeholders of the other sources are resolved first, and the detail is merged after them. The detail itself is never read for placeholders, because it is runtime data. The modifier applies to a `CustomEvent` only, since a native event carries no detail to merge.

```html
<div data-track:form-submitted.detail='{"event": "lead"}'></div>
```

::: warning
Placeholders are read in every source, including data that a server writes into a `TrackContext` or a payload script. Do not write untrusted text, such as a search term, in a way that it can become a whole value starting with `$event.` or `$detail.`. It would be read as a path on the event.
:::

## Options

| Option      | Type     | Default | Description                                                                                       |
| ----------- | -------- | ------- | ------------------------------------------------------------------------------------------------- |
| `threshold` | `Number` | `0`     | `IntersectionObserver` threshold for the `view` event (`0` fires as soon as any part is visible). |
| `payload`   | `Object` | `{}`    | Base payload shared by every event, from `data-option-payload`.                                   |

## Refs

| Ref       | On                       | Description                                                            |
| --------- | ------------------------ | ---------------------------------------------------------------------- |
| `payload` | `Track` / `TrackShopify` | `<script type="application/json">` holding the element's base payload. |
| `context` | `TrackContext`           | `<script type="application/json">` holding the context data.           |

## TrackContext

`TrackContext` supplies data inherited by every descendant `Track`. Its data comes from a `<script data-ref="context" type="application/json">` and/or a `data-option-context` attribute (the attribute overrides the script on conflicts).

Context is resolved by walking up the ancestor chain (`$closest('TrackContext')`) and deep-merging every `TrackContext` — the nearest one wins.

```html
<div data-component="TrackContext">
  <script data-ref="context" type="application/json">
    { "page_type": "product" }
  </script>

  <div data-component="TrackContext" data-option-context='{"variant": "red"}'>
    <button data-component="Track" data-track:click='{"event": "add_to_cart"}'></button>
    <!-- dispatched: { page_type: "product", variant: "red", event: "add_to_cart" } -->
  </div>
</div>
```

## Providers

`dispatch(payload, event?)` is the seam that sends the resolved payload to its destination:

- **`Track`** — `window.dataLayer.push(payload)`.
- **`TrackShopify`** — `window.Shopify.analytics.publish(payload.event, payload)`, guarded when the API is unavailable or the payload has no `event` name. Namespace Shopify event names (e.g. `my_app:add_to_cart`).

To send to any other destination (Segment, a custom endpoint, …), extend `Track` and override `dispatch()`:

```js
import { Track } from '@studiometa/ui';

export class TrackSegment extends Track {
  static config = { ...Track.config, name: 'TrackSegment' };

  dispatch(payload) {
    window.analytics?.track(payload.event, payload);
  }
}
```
