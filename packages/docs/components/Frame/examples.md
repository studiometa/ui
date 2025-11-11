---
title: Frame examples
---

# Examples

## Simple

Intercepting clicks on links, displaying a loader and updating the targets' content.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/simple/app.twig')"
  :css="() => import('./stories/simple/app.css?raw')"
  :css-editor="false"
  :script="() => import('./stories/simple/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/simple/app.twig
<<< ./stories/simple/app.css
<<< ./stories/simple/app.js

:::

</llm-only>

## Target modes: replace, append, prepend

In the following example, we implement three different `FrameTarget` components, each with one the available content update strategy ("mode"): replace (the default), append or prepend.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/modes/app.twig')"
  :script="() => import('./stories/modes/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/modes/app.twig
<<< ./stories/modes/app.js

:::

</llm-only>

## Form

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/form/app.twig')"
  :css="() => import('./stories/simple/app.css?raw')"
  :css-editor="false"
  :script="() => import('./stories/form/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/form/app.twig
<<< ./stories/simple/app.css
<<< ./stories/form/app.js

:::

</llm-only>

## Adding a product to a cart

This example uses the [`Frame` components](/components/Frame/), as well as the [`Action`](/components/Action/), [`Figure`](/components/Figure/) and [`Panel`](/components/Panel/) components, to add support for adding products to a cart without reloading the page.

The `FrameForm` and `FrameAnchor` components are used to intercept click on links and form submission to make request in the background. The  `FrameLoader` component displays a nice loader while the request are made. The `FrameTarget` components are then used to update some of the content on the page.

The `Panel` component is used to display a nice cart and the `Action` component listens to the `Frame` event `frame-content`, which signals that the new content is being inserted, to open the cart and display the newly inserted content.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/products/app.twig')"
  :script="() => import('./stories/products/app.js?raw')"
  :css="() => import('./stories/products/app.css?raw')"
  :css-editor="false"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/products/app.twig
<<< ./stories/products/app.js
<<< ./stories/products/app.css

:::

</llm-only>
