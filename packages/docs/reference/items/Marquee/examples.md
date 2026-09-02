---
title: Marquee examples
---

# Examples

## Horizontal

The default direction, and the same marquee with a negative `sensitivity`, which reverses it.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/app.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/app.twig
<<< ./stories/app.js

:::

</llm-only>

## Skewed by the velocity

The skew is CSS: the track's `transform` reads `--marquee-velocity` and clamps it. The component knows nothing about it.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/app-2.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/app-2.twig
<<< ./stories/app.js

:::

</llm-only>

## Circular

The same class, a different `transform`.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/app-3.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/app-3.twig
<<< ./stories/app.js

:::

</llm-only>

## Circular, faster and reversed

:::tip Why are there two radius parameters?

- `outer_radius` sets the size of the **svg viewBox**. `radius` sets the size of the `<path>` the circular text is written on.
- `outer_radius` needs to be greater in order to **avoid cutting** the text, since the `<svg>` always hides the overflowing content.

:::

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/app-4.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/app-4.twig
<<< ./stories/app.js

:::

</llm-only>
