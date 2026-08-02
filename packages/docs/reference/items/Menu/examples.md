---
title: Menu examples
---

# Examples

## Burger menu

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/burger/app.twig')"
  :script="() => import('./stories/burger/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/burger/app.twig
<<< ./stories/burger/app.js

:::

</llm-only>

## Dropdown

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/dropdown/app.twig')"
  :script="() => import('./stories/dropdown/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/dropdown/app.twig
<<< ./stories/dropdown/app.js

:::

</llm-only>

## Mega menu

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/mega-menu/app.twig')"
  :script="() => import('./stories/mega-menu/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/mega-menu/app.twig
<<< ./stories/mega-menu/app.js

:::

</llm-only>

## Responsive mega menu

Switch from a mega menu on desktop to a burger menu on mobile.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/mega-menu-responsive/app.twig')"
  :script="() => import('./stories/mega-menu-responsive/app.js?raw')"
  :css="() => import('./stories/mega-menu-responsive/app.css?raw')"
  :css-editor="false"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/mega-menu-responsive/app.twig
<<< ./stories/mega-menu-responsive/app.js
<<< ./stories/mega-menu-responsive/app.css

:::

</llm-only>
