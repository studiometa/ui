# Examples

## Default
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

## Higher sensitivity
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

## Negative sensitivity
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

## Exemple with same `outer_radius` and `radius`

:::tip Why is there two radius parameters ?
- `outer_radius` set the size of the **svg viewbox**. `radius` set the size of the `<path>` on which the circular text will be written.
- `outer_radius` needs to be greater in order to **avoid cutting** the text since the `<svg>` will always hide the overflowing content.
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
