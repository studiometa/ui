---
title: Draggable examples
---

# Examples

## Simple

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

## Fit bounds

Use the `data-option-fit-bounds` attribute to keep the draggable target in the component's root element bounds on drop.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/bounds/app.twig')"
  :script="() => import('./stories/bounds/app.js?raw')"
  :css="() => import('./stories/bounds/app.css?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/bounds/app.twig
<<< ./stories/bounds/app.js
<<< ./stories/bounds/app.css

:::

</llm-only>

## Strict fit bounds

Use the `data-option-strict-fit-bounds` attribute to keep the draggable target in the component's root element bounds.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/strict-bounds/app.twig')"
  :script="() => import('./stories/strict-bounds/app.js?raw')"
  :css="() => import('./stories/strict-bounds/app.css?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/strict-bounds/app.twig
<<< ./stories/strict-bounds/app.js
<<< ./stories/strict-bounds/app.css

:::

</llm-only>

## Margin

Use the `data-option-margin` attribute to configure inner or outer margins.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/margin/app.twig')"
  :script="() => import('./stories/margin/app.js?raw')"
  :css="() => import('./stories/margin/app.css?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/margin/app.twig
<<< ./stories/margin/app.js
<<< ./stories/margin/app.css

:::

</llm-only>

## Carousel like

By disabling drag on the `y` axis with the `data-option-no-y` attribute and with the `data-option-fit-bounds` option enabled, we can begin implementing a draggable carousel.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/carousel/app.twig')"
  :script="() => import('./stories/carousel/app.js?raw')"
  :css="() => import('./stories/carousel/app.css?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/carousel/app.twig
<<< ./stories/carousel/app.js
<<< ./stories/carousel/app.css

:::

</llm-only>

## Dynamic parent

By default, the [`parent` getter](./js-api.md#parent) returns the component's root element. The getter can be overriden to get a dynamic parent that will be resolved when dropping the element defined by the [`target` getter](./js-api.md#target).

In the following example, the [`Action` component](../Action/index.md) is used to toggle the `ring` class on each colored square when they are clicked. The `Draggable` component is extended to override the `parent` getter to find the first element in the DOM with the `ring` class and use it as a basis to calculate the bounds.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/dynamic-parent/app.twig')"
  :script="() => import('./stories/dynamic-parent/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/dynamic-parent/app.twig
<<< ./stories/dynamic-parent/app.js

:::

</llm-only>
