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

A link or a form gives `Fetch` its destination. Any other element requests the endpoint of the [`src` option](./js-api.md#src) when [`fetch()`](./js-api.md#fetch-destination-string-url) is called. In the following example the panel is a `<div>`: it combines `Fetch` with the [`InViewOnce`](../InViewOnce/index.md) and [`Action`](../Action/index.md) components, so its content is loaded the first time it scrolls into view, with a bare `Fetch.fetch()` call.

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

## Pagination

A set of submit buttons is a paginator with no script of its own: each button sends its own `page` value, and the hidden `orderby` field travels with every submission. The [`params` option](./js-api.md#params) adds the template of the results to every request, so it never reaches the address bar. With the [`history` option](./js-api.md#history), each page is a history entry that back and forward restore. See [forms](./index.md#forms).

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

::: tip Back and forward
The preview runs in a frame with no address of its own, so `Fetch` writes no history entry there. On a page, the second button writes `?orderby=title&page=2`, and back requests page 1 again with the same `params`.
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

Use the [`abort` method](./js-api.md#abort-reason-unknown) to cancel a request. In the following example, we use the [`Action` component](../Action/index.md) to cancel any pending request from any mounted `Fetch` component.

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

Request the sections to update with the comma-separated `sections` parameter (up to five). Set it with the [`params` option](./js-api.md#params), so the `href` stays a working link without JavaScript and the parameter never reaches the address bar:

:::code-group

```html [collection.liquid]
<a
  href="{{ collection.url }}?sort_by=price-ascending"
  data-component="Fetch"
  data-option-params='{"sections": "main-collection-product-grid,collection-results-count"}'
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
Use a `<form method="get">` instead of a link when the parameters come from user input (facet filters, a sort `<select>`, a search field): the fields become the query of the request, and the [`params` option](./js-api.md#params) adds `sections` to it. No hidden `<input name="sections">` is needed.
:::
