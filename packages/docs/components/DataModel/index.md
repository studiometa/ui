---
badges: [JS]
---

# DataModel <Badges :texts="$frontmatter.badges" />

Use the `DataModel` component to create a two-way binding of a property of HTML form elements. This component should be used alongside the [`DataBind`](../DataBind/index.md), [`DataComputed`](../DataComputed/index.md) and [`DataEffect`](../DataEffect/index.md) components to update other elements accordingly.

## Table of content

- [Examples](./examples.md)
- [JavaScript API](./js-api.md)

## Usage

Import the components in your main app and use the `DataModel` component on HTML form elements and the `DataBind` and `DataComputed` components on other elements that need to be updated accordingly. The `DataEffect` component can be used to execute side effects when the value changes.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/basic.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/basic.twig
<<< ./stories/app.js

:::

</llm-only>
