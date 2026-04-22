---
title: Hoverable examples
---

# Examples

## Default

Moves the target relative to the pointer inside rectangular bounds.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/default.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/default.twig
<<< ./stories/app.js

:::

</llm-only>

## Reversed

Inverts the movement direction for a counter-motion effect.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/reversed.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/reversed.twig
<<< ./stories/app.js

:::

</llm-only>

## Contained

Stops updating when the pointer leaves the root element.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/contained.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/contained.twig
<<< ./stories/app.js

:::

</llm-only>

## Reversed and contained

Combines reversed motion with contained pointer tracking.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/reversed-contained.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/reversed-contained.twig
<<< ./stories/app.js

:::

</llm-only>

## Circle shape

Constrains movement to an inscribed circular area.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/circle.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/circle.twig
<<< ./stories/app.js

:::

</llm-only>

## Ellipse shape

Constrains movement to an inscribed elliptical area.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/ellipse.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/ellipse.twig
<<< ./stories/app.js

:::

</llm-only>
