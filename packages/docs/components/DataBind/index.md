---
badges: [JS]
---

# DataBind <Badges :texts="$frontmatter.badges" />

Use the `DataBind`, `DataModel`, `DataEffect` and `DataComputed` components to bind and synchronize data between DOM elements.

## Table of content

- [Examples](./examples.md)
- [JavaScript API](./js-api.md)

## Usage

Import the components in your main app and use the [`DataModel` component](../DataModel/index.md) on HTML form elements and the `DataBind` and [`DataComputed`](../DataComputed/index.md) components on other elements that need to be updated accordingly. The [`DataEffect` component](../DataEffect/index.md) can be used to execute side effects when the value changes.

<PreviewPlayground
  :html="() => import('./stories/basic.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
