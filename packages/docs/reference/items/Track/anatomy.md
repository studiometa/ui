---
title: Track anatomy
---

# Anatomy

The `Track` family declares analytics entirely in markup. A tracked element carries `data-track:<event>` attributes, and an optional `TrackContext` ancestor factors out data shared by every descendant. Use this map to see which parts exist and how they nest.

## Structure

```
TrackContext                           data-component="TrackContext"   shared, inherited data   (optional)
└─ Track | TrackShopify                data-component="Track"          one tracked element
   ├─ data-track:<event>="…"           the events to dispatch
   └─ <script data-ref="payload">      shared payload for this element  (optional)
```

## Parts

| Part | Selector | Required | Role |
| --- | --- | --- | --- |
| Tracker | `data-component="Track"` | Yes | Resolves each `data-track:<event>` payload and pushes it to `window.dataLayer`. |
| Tracker (Shopify) | `data-component="TrackShopify"` | Yes* | Same as `Track`, but publishes through `window.Shopify.analytics.publish`. |
| Context | `data-component="TrackContext"` | Optional | Provides data inherited by every descendant tracker, deep-merged up the ancestor chain. |
| Payload | `data-ref="payload"` | Optional | A `<script>` (or `data-option-payload`) holding data shared by every event on the element. |

<small>\* `Track` and `TrackShopify` are alternative providers — pick the one matching your destination. The provider is chosen by the component name, so switching is a one-token change in the markup.</small>

Context is deep-merged from the whole ancestor chain, with the nearest `TrackContext` winning. See the [JavaScript API](./js-api.md) for payload resolution, providers and event modifiers.
