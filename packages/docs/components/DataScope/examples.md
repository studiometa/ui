---
title: DataScope examples
---

# Examples

## Isolated reusable widgets

Sibling scopes remain independent even when they use the same group name. In the following example, each profile owns its `person` group and its own `$data` snapshot. Updating one profile does not update the other.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/isolated.twig')"
  :script="() => import('./stories/isolated.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/isolated.twig
<<< ./stories/isolated.js

:::

</llm-only>

## Tabs

The following example implements two independent tab interfaces with `DataScope`, [`Action`](../Action/index.md), [`DataModel`](../DataModel/index.md), and [`DataBind`](../DataBind/index.md). The tab buttons are mirrored models for the same `active` key: the first button hydrates the initial value, every button can publish a new value, and virtual bindings synchronize the selected state and panels. The `Tabs` component is not registered.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/tabs.twig')"
  :script="() => import('./stories/tabs.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/tabs.twig
<<< ./stories/tabs.js

:::

</llm-only>

## Accordion

This example uses the same mirrored-model pattern for two independent accordion interfaces. Each button toggles the shared `active` key with [`toggle()`](../DataBind/js-api.md); opening one panel closes the other panels in that scope, and clicking the open item closes it. The `Accordion` component is not registered.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/accordion.twig')"
  :script="() => import('./stories/accordion.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/accordion.twig
<<< ./stories/accordion.js

:::

</llm-only>

## Nested and explicit groups

A Data component without `data-option-group` inherits the group of its nearest `DataScope`. An explicit group creates another group inside the same scope instead of escaping the scope.

```html
<div data-component="DataScope" data-option-group="profile">
  <!-- Uses the local "profile" group. -->
  <input name="name" data-component="DataModel" />

  <!-- Uses a separate local "settings" group. -->
  <input
    name="theme"
    value="dark"
    data-component="DataModel"
    data-option-group="settings"
    data-option-immediate />

  <div data-component="DataScope" data-option-group="address">
    <!-- Uses the nested scope's local "address" group. -->
    <input name="city" data-component="DataModel" />
  </div>
</div>
```
