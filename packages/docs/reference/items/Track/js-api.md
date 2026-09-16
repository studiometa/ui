---
title: Track JS API
---

# Track JS API

## Components

| Component      | Destination                                                                              |
| -------------- | ---------------------------------------------------------------------------------------- |
| `Track`        | `window.dataLayer.push(payload)` (GTM / GA4)                                             |
| `TrackShopify` | `window.Shopify.analytics.publish(payload.event, payload)`, gated on [consent](#consent) |
| `TrackContext` | Provides context inherited by descendant `Track`s                                        |

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

| Event     | Behaviour                                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| `mounted` | Dispatched once, when the component mounts.                                                                           |
| `view`    | Dispatched when the element enters the viewport, via `IntersectionObserver` (see the [`threshold`](#options) option). |

Any other name binds a native DOM event (`click`, `mouseenter`, `submit`, a `CustomEvent` type, …).

### Modifiers

| Modifier                      | Effect                                                                |
| ----------------------------- | --------------------------------------------------------------------- |
| `.prevent`                    | `event.preventDefault()`                                              |
| `.stop`                       | `event.stopPropagation()`                                             |
| `.once`                       | Dispatch at most once (also stops the `view` observer).               |
| `.passive`                    | Register the listener as passive.                                     |
| `.capture`                    | Register the listener in the capture phase.                           |
| `.debounce` / `.debounce<ms>` | Debounce the dispatch (default `300`).                                |
| `.throttle` / `.throttle<ms>` | Throttle the dispatch (default `16`).                                 |
| `.detail`                     | For a `CustomEvent`, merge the whole `event.detail` into the payload. |

Example: `data-track:input.debounce500`, `data-track:click.prevent.once`.

## Payload

The dispatched payload is deep-merged from the following sources, in increasing priority:

1. **Inherited context** — from ancestor `TrackContext` components (see below).
2. **Component payload** — shared by every event on the element, from a `<script data-ref="payload" type="application/json">` child and/or a `data-option-payload` attribute (the option overrides the ref on conflicts).
3. **Event payload** — the JSON value of the `data-track:<event>` attribute (or the `event` key when the bare-name shorthand is used).

Later sources win on conflicting keys. **Arrays are replaced, not concatenated**, so a more specific layer fully overrides a list (e.g. GA4 `ecommerce.items`) from a broader one.

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

### Custom event data

For a `CustomEvent`, resolve values from its `detail` with `$detail.<path>` placeholders, or merge the full detail with the `.detail` modifier:

```html
<!-- Pull specific fields -->
<div data-track:form-submitted='{"event": "lead", "email": "$detail.email"}'></div>

<!-- Merge the whole detail -->
<div data-track:form-submitted.detail='{"event": "lead"}'></div>
```

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
- **`TrackShopify`** — `window.Shopify.analytics.publish(payload.event, payload)`, guarded when the API is unavailable, when the payload has no `event` name, and when [analytics consent](#consent) is not granted. Namespace Shopify event names (e.g. `my_app:add_to_cart`).

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

## Consent

`TrackShopify` is consent-safe by default. Before each publish it calls `window.Shopify.customerPrivacy.analyticsProcessingAllowed()` and publishes only when that call returns `true`.

- The check runs on every dispatch, not once at mount. `window.Shopify` is read fresh each time, so a consent change applies to the next event without a remount.
- A denied consent drops the event. Nothing is queued, and a dropped event is never replayed once consent is granted.
- An absent Customer Privacy API drops the event as well. Shopify loads that API asynchronously through `loadFeatures()`, so it is legitimately undefined early in the page's life.
- Every drop reports a diagnostic, so a missing event is diagnosable instead of silent.

The event name is validated before consent is read. A declaration without an `event` name is wrong for every visitor, so it is reported even when consent is denied.

This gate covers what the platform does not. Shopify's Web Pixels Manager gates App Pixels at load time: it loads a pixel only when the visitor has granted every consent that pixel declares as required. Custom pixels receive every published event and are expected to apply their own consent logic, which is what `TrackShopify` does for you.

`Track` is not gated the same way, on purpose. It appends to `window.dataLayer`, an array in the page that transmits nothing by itself. The tag manager or CMP reading that array decides what leaves the browser, so consent belongs at the tag level there.

## Diagnostics

| Code                                | Reported when                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `track.invalid-json`                | An attribute value, a `payload` ref or a `context` ref holds malformed JSON   |
| `track.missing-event-name`          | `TrackShopify` resolved a payload with no string `event` key                  |
| `track.shopify-unavailable`         | `window.Shopify.analytics.publish` is not a function                          |
| `track.shopify-privacy-unavailable` | `window.Shopify.customerPrivacy.analyticsProcessingAllowed` is not a function |
| `track.shopify-consent-denied`      | `analyticsProcessingAllowed()` returned `false`                               |
