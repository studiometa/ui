# Examples

## Default
<PreviewPlayground
  :html="() => import('./stories/app.twig')"
  :script="() => import('./stories/app.js?raw')"
  />

## Higher sensitivity
<PreviewPlayground
  :html="() => import('./stories/app-2.twig')"
  :script="() => import('./stories/app.js?raw')"
  />

## Negative sensitivity
<PreviewPlayground
  :html="() => import('./stories/app-3.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
