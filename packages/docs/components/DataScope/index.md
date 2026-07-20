---
badges: [JS]
---

# DataScope <Badges :texts="$frontmatter.badges" />

Use the `DataScope` component to isolate [`DataBind`](../DataBind/index.md), [`DataModel`](../DataModel/index.md), [`DataComputed`](../DataComputed/index.md), and [`DataEffect`](../DataEffect/index.md) groups inside a reusable widget.

Descendant Data components inherit the scope's group unless they define their own `data-option-group`. Nested scopes use the nearest `DataScope` boundary.

## Usage

Import the `DataScope` component with the Data components used by your application. Add `DataScope` to the root element of a widget, then omit `data-option-group` from descendants that should inherit its default group.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/basic.twig')"
  :script="() => import('./stories/basic.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/basic.twig
<<< ./stories/basic.js

:::

</llm-only>

The native `name` of a form control becomes its key inside the scope. Use `data-option-key` to define a key explicitly. Non-radio `DataModel` controls with the same key mirror each other and jointly retain the scoped value. Unkeyed computed values and effects receive the complete frozen `$data` snapshot, allowing expressions to combine several keyed values.

See the [JavaScript API](./js-api.md) for details about group inheritance, keys, and scoped data snapshots.
