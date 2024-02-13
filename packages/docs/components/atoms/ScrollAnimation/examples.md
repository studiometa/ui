---
title: ScrollAnimation examples
---

# Examples

## Simple animation

<PreviewPlayground
  :html="() => import('./stories/simple/app.twig')"
  :script="() => import('./stories/simple/app.js?raw')"
  />

## Parent driven animation

<PreviewPlayground
  :html="() => import('./stories/parent/app.twig')"
  :script="() => import('./stories/parent/app.js?raw')"
  />

## Parallax

You can easily implement a parallax effect with images by combining the `ScrollAnimation` class with the [Figure component](/components/atoms/Figure/).

Here, we even use the [ImageGrid organism](/components/organisms/ImageGrid/) to quickly have a nice listing layout. We are able to configure it to wrap each image in a `Parallax` component.

<PreviewPlayground
  :html="() => import('./stories/parallax/app.twig')"
  :script="() => import('./stories/parallax/app.js?raw')"
  />

## Parallax with a parent

It might be sometimes interesting to use the parent ↔ child logic of the `ScrollAnimation` component to improve performance, as only the parent progression in the viewport is watched.

The resulting effect is different as each child animation is driven by the parent one, but it is still interesting.

<PreviewPlayground
  :html="() => import('./stories/parallax-parent/app.twig')"
  :script="() => import('./stories/parallax-parent/app.js?raw')"
  />
