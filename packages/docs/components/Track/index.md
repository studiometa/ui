---
badges: [JS]
---

# Track <Badges :texts="$frontmatter.badges" />

The `Track` components provide declarative analytics tracking, defined entirely in HTML/Twig/Liquid attributes — no custom JavaScript required. A provider-agnostic core (`AbstractTrack`) is shipped as two ready-to-use variants selected by component name:

- **`Track`** pushes the resolved payload to `window.dataLayer` (GTM / GA4).
- **`TrackShopify`** publishes it through `window.Shopify.analytics.publish`.

`TrackContext` lets you factor shared data out of individual events and inherit it from ancestors.

## Table of content

- [Examples](./examples.md)
- [JS API](./js-api.md)

## Usage

Register the components you need in your application:

```js
import { Base, createApp } from '@studiometa/js-toolkit';
import { Track, TrackShopify, TrackContext } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Track,
      TrackShopify,
      TrackContext,
    },
  };
}

createApp(App);
```

Then declare what to track with `data-track:<event>` attributes. The value can be a bare event name (`data-track:click="add_to_cart"`) or, when an event needs its own structured data, a JSON payload whose `event` key holds the name. Data shared by every event on the element can be provided through a `<script data-ref="payload">` child or a `data-option-payload` attribute.

### Click tracking

Track user interactions with `data-track:click`:

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/basic/click.twig')"
  :script="() => import('./stories/basic/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/basic/click.twig
<<< ./stories/basic/app.js

:::

</llm-only>

### Page-load tracking

Use the reserved `mounted` event to dispatch on mount (e.g. a page view):

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/basic/mounted.twig')"
  :script="() => import('./stories/basic/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/basic/mounted.twig
<<< ./stories/basic/app.js

:::

</llm-only>

### Impression tracking

The reserved `view` event dispatches when the element enters the viewport (via `IntersectionObserver`). Add `.once` to fire a single impression, and tune visibility with the `threshold` option.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/basic/view.twig')"
  :script="() => import('./stories/basic/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/basic/view.twig
<<< ./stories/basic/app.js

:::

</llm-only>

### Shared context

Wrap a section in `TrackContext` to provide data inherited by every descendant `Track`. Context is deep-merged up the whole ancestor chain — the nearest context wins. Author it in a `<script data-ref="context" type="application/json">` (safe with Liquid/Twig, even with quotes in values) or, for simple cases, a `data-option-context` attribute.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/basic/context.twig')"
  :script="() => import('./stories/basic/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/basic/context.twig
<<< ./stories/basic/app.js

:::

</llm-only>

### Custom events

Track a `CustomEvent` emitted by third-party scripts and pull values from its `detail` with the `$detail.*` placeholder syntax:

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/basic/custom-event.twig')"
  :script="() => import('./stories/basic/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/basic/custom-event.twig
<<< ./stories/basic/app.js

:::

</llm-only>

### Multiple events

Declare several `data-track:*` attributes on one element to track independent events, each with its own payload and modifiers:

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/basic/multiple.twig')"
  :script="() => import('./stories/basic/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/basic/multiple.twig
<<< ./stories/basic/app.js

:::

</llm-only>

## Choosing a provider

The provider is chosen by the component name, so switching destinations is a one-token change in the markup:

```html
<!-- Google Tag Manager / dataLayer -->
<button data-component="Track" data-track:click='{"event": "add_to_cart"}'>Add to cart</button>

<!-- Shopify storefront analytics -->
<button data-component="TrackShopify" data-track:click='{"event": "my_app:add_to_cart"}'>
  Add to cart
</button>
```

`TrackShopify` uses the payload's `event` value as the published event name. Shopify recommends namespacing custom events (e.g. `my_app:add_to_cart`). To send to another destination, extend `Track` and override its [`dispatch()`](./js-api.md#providers) method.

::: warning
Payloads are serialised into the DOM (attribute or `<script>`), so they are visible in the page source. Never put personal data (emails, names, user IDs) in a tracking payload — resolve sensitive values at runtime via a `CustomEvent` and `$detail.*` instead, and gate `TrackShopify` on the visitor's analytics consent where required.
:::
