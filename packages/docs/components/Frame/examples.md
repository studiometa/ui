---
title: Frame examples
---

# Examples

## Simple

Intercepting clicks on links, displaying a loader and updating the targets' content.

<PreviewPlayground
  :html="() => import('./stories/simple/app.twig')"
  :css="() => import('./stories/simple/app.css?raw')"
  :css-editor="false"
  :script="() => import('./stories/simple/app.js?raw')"
  />

## Target modes: replace, append, prepend

In the following example, we implement three different `FrameTarget` components, each with one the available content update strategy ("mode"): replace (the default), append or prepend.

<PreviewPlayground
  :html="() => import('./stories/modes/app.twig')"
  :script="() => import('./stories/modes/app.js?raw')"
  />

## Form

<PreviewPlayground
  :html="() => import('./stories/form/app.twig')"
  :css="() => import('./stories/simple/app.css?raw')"
  :css-editor="false"
  :script="() => import('./stories/form/app.js?raw')"
  />

## Adding a product to a cart

This example uses the [`Frame` components](/components/Frame/), as well as the [`Action`](/components/Action/), [`Figure`](/components/Figure/) and [`Panel`](/components/Panel/) components, to add support for adding products to a cart without reloading the page.

The `FrameForm` and `FrameAnchor` components are used to intercept click on links and form submission to make request in the background. The  `FrameLoader` component displays a nice loader while the request are made. The `FrameTarget` components are then used to update some of the content on the page.

The `Panel` component is used to display a nice cart and the `Action` component listens to the `Frame` event `frame-content`, which signals that the new content is being inserted, to open the cart and display the newly inserted content.

<PreviewPlayground
  :html="() => import('./stories/products/app.twig')"
  :script="() => import('./stories/products/app.js?raw')"
  :css="() => import('./stories/products/app.css?raw')"
  :css-editor="false"
  />
