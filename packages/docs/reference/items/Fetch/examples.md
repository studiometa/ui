---
title: Fetch examples
---

# Examples

## Simple

Intercepting clicks on links, displaying a loader and updating the targets' content.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/simple/app.twig')"
  :script="() => import('./stories/simple/app.ts?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/simple/app.twig
<<< ./stories/simple/app.ts

:::

</llm-only>

## Fetch from any element

`Fetch` normally reads its URL from an `<a href>` or `<form action>`, but the [`src` option](./js-api.md#src) lets it be driven from **any** element and triggered programmatically. In the following example the panel is a `<div>`: it combines `Fetch` with the [`InViewOnce`](../InViewOnce/index.md) and [`Action`](../Action/index.md) components so that its content is lazy-loaded the first time it scrolls into view, with a bare [`Fetch.fetch()`](./js-api.md#fetch-url-url-string-requestinit-requestinit-context-fetchrequestcontext) call that resolves the `src` URL on its own.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/src/app.twig')"
  :script="() => import('./stories/src/app.ts?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/src/app.twig
<<< ./stories/src/app.ts

:::

</llm-only>

## Form

In the following example, we intercept a form submission, display a loader and use a custom view transition to animate only the updated content once the request is finished.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/form/app.twig')"
  :script="() => import('./stories/form/app.ts?raw')"
  :css="() => import('./stories/form/app.css?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/form/app.twig
<<< ./stories/form/app.ts
<<< ./stories/form/app.css

:::

</llm-only>

## Pagination with submit buttons

An intercepted submission sends the button that caused it, so a set of `<button type="submit" name="page">` controls is a paginator with no script of its own. Each button carries its own `page` value, and the hidden `orderby` field travels with every submission. See [form submissions](./js-api.md#form-submissions).

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/pagination/app.twig')"
  :script="() => import('./stories/pagination/app.ts?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/pagination/app.twig
<<< ./stories/pagination/app.ts

:::

</llm-only>

## Live search with a separate source

A live search displays one URL and requests another. The form's `action` is the full results page a visitor can copy and a no-JS submission reaches; the [`src` option](./js-api.md#src) points the enhanced request at a fragment endpoint. [`historyMode`](./js-api.md#historymode) set to `replace` keeps the address bar in step without spending one history entry per keystroke.

::: code-group

```html [index.html]
<form
  id="search"
  action="/help"
  method="get"
  data-component="Fetch"
  data-option-src="/apps/search?view=fragment"
  data-option-history
  data-option-history-mode="replace">
  <input
    type="search"
    name="q"
    data-component="Action"
    data-on:input.debounce300="Fetch(#search)->target.fetch()" />
</form>

<div id="search-results">…</div>
```

```js twoslash [app.ts]
import { registerComponent } from '@studiometa/js-toolkit';
import { Action, Fetch } from '@studiometa/ui';

registerComponent(Action);
registerComponent(Fetch);
```

:::

Typing `shipping` requests `/apps/search?view=fragment&q=shipping` and displays `/help?q=shipping`. Pressing back restores `/help`, and the request is rebuilt against the source: `/apps/search?view=fragment`, with the restored entry's parameters rather than the text still sitting in the input.

::: tip
`Fetch` aborts the request in flight when a new one starts, so a fast typist never sees an older response land. The `debounce300` modifier of the [`Action`](../Action/js-api.md#on) component spares the endpoint the keystrokes in between.
:::

## Modes

Modes are configured with the [`data-option-mode` attribute](./js-api.md#mode).

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/modes/app.twig')"
  :script="() => import('./stories/modes/app.ts?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/modes/app.twig
<<< ./stories/modes/app.ts

:::

</llm-only>

## Add to cart / Quickbuy

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/products/app.twig')"
  :script="() => import('./stories/products/app.ts?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/products/app.twig
<<< ./stories/products/app.ts

:::

</llm-only>

## Error handling

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/error/app.twig')"
  :script="() => import('./stories/error/app.ts?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/error/app.twig
<<< ./stories/error/app.ts

:::

</llm-only>

## Cancelling a request

Use the [`abort` method](./js-api.md#abort-reason-any) to cancel a request. In the following example, we use the [`Action` component](../Action/index.md) to cancel any pending request from any mounted `Fetch` component.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/abort/app.twig')"
  :script="() => import('./stories/abort/app.ts?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/abort/app.twig
<<< ./stories/abort/app.ts

:::

</llm-only>

::: tip
In this example, we could use a more specific version of the [`data-option-target` attribute](../Action/js-api.md#target) of the `Action` component to target a single `Fetch` instance.
:::

## Shopify Section Rendering API

Shopify's [Section Rendering API](https://shopify.dev/docs/api/ajax/section-rendering) returns the rendered HTML of specific theme sections as a JSON object: each key is a requested section ID and each value is that section's HTML — or `null` when the section fails to render. Because every section is wrapped in a `<div id="shopify-section-{id}">` element both on the page and inside the API response, the `Fetch` component can consume it **without any extra code**: parse the JSON with the [`response` option](./js-api.md#response) and let the default [`[id]` selector](./js-api.md#selector) swap each section in place.

::: tip
The [`FetchShopifySection`](../FetchShopifySection/index.md) component wraps this pattern: it declares the sections through a `sections` option (keeping them out of the `href` for a working no-JS fallback) and ships the JSON extraction below as its default, so you don't repeat it on every element.
:::

Request the sections to update by adding the comma-separated `sections` parameter (up to five) to the URL:

:::code-group

```html [collection.liquid]
<a
  href="{{ collection.url }}?sort_by=price-ascending&sections=main-collection-product-grid,collection-results-count"
  data-component="Fetch"
  data-option-response="response.json().then((sections) => Object.values(sections).filter(Boolean).join(''))">
  Sort by price
</a>

{% comment %} These wrappers, rendered by Shopify, are what Fetch swaps by id. {% endcomment %}
<div id="shopify-section-main-collection-product-grid">…</div>
<div id="shopify-section-collection-results-count">…</div>
```

```json [GET ?sections=… response]
{
  "main-collection-product-grid": "<div id=\"shopify-section-main-collection-product-grid\" class=\"shopify-section\">…</div>",
  "collection-results-count": "<div id=\"shopify-section-collection-results-count\" class=\"shopify-section\">…</div>"
}
```

:::

- `filter(Boolean)` drops any section returned as `null` (for example a section absent from the published theme) so the parser only receives valid HTML.
- The JSON keys are ignored: `Fetch` matches each section by the `id` of its `shopify-section-*` wrapper, so there is never a key/id mismatch.
- Keep the default `replace` [`mode`](./js-api.md#mode) (or use `morph`) so each section is swapped in place — `append` and `prepend` insert the new markup _inside_ the existing `shopify-section-{id}` wrapper and would duplicate its content. This works together with the [`history`](./js-api.md#history) and [`viewTransition`](./js-api.md#viewtransition) options.

::: tip
Use a `<form method="get">` instead of a link when the parameters come from user input (facet filters, a sort `<select>`, a search field): the form data is [automatically appended to the URL](./js-api.md#url), so you only need to add a hidden `<input name="sections">`.
:::
