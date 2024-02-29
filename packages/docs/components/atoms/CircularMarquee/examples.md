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

## Exemple with same `outer_radius` and `radius`

:::tip Why is there two radius parameters ?
- `outer_radius` set the size of the **svg viewbox**. `radius` set the size of the `<path>` on which the circular text will be written.
- `outer_radius` needs to be greater in order to **avoid cutting** the text since the `<svg>` will always hide the overflowing content.
:::

<PreviewPlayground
  :html="() => import('./stories/app-4.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
