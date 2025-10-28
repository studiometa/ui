---
badges: [JS]
---

# DataModel <Badges :texts="$frontmatter.badges" />

Use the `DataModel`.

## Table of content

- [Examples](./examples.html)
- [JavaScript API](./js-api.html)

## Usage

Import the components in your main app and use the `DataModel` component on HTML form elements and the `DataBind` and `DataComputed` components on other elements that need to be updated accordingly. The `DataEffect` component can be used to execute side effects when the value changes.

<PreviewPlayground
  :html="() => import('./stories/basic.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
