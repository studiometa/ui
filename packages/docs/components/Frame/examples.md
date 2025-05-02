---
title: Frame examples
---

# Examples

## Simple

Intercepting clicks on links, displaying a loader and updating the targets' content.

<PreviewPlayground
  :html="() => import('./stories/simple/app.twig')"
  :css="() => import('./stories/simple/app.css?raw')"
  :script="() => import('./stories/simple/app.js?raw')"
  />

## Target modes: replace, append, prepend

In the following example, we implement three different `FrameTarget` components, each with one the available content update strategy ("mode"): replace (the default), append or prepend.

<PreviewPlayground
  :html="() => import('./stories/modes/app.twig')"
  :script="() => import('./stories/modes/app.js?raw')"
  />
