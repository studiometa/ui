---
title: Prefetch JS API
---

# JS API

## Options

### `prefetch`

- Type: `boolean`
- Default: `true`

The `data-option-no-prefetch` attribute disables prefetching on specific elements.

## Getters

### `isPrefetchable`

Getter used to check if the current URL is prefetchable or not. Prefetchable URLs are different from the current URL, not a hash in the current URL and share the same origin with the current page.

## Methods

### `prefetch()`

Trigger prefetching by appending a `<link rel="prefetch" href="...">` to the `<head>` of the current document.

## Events

### `prefetched`

- Parameters:
  - `url` (`URL`): the prefetched URL

Emitted when the URL has been prefetched.
