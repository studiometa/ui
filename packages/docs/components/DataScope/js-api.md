---
title: DataScope JavaScript API
outline: deep
---

# JS API

The `DataScope` component defines a local boundary for Data groups and stores keyed values in frozen `$data` snapshots.

## Options

### `group`

- Type: `string`
- Default: `'default'`

The `group` option defines the group inherited by descendant Data components that do not set their own `data-option-group`.

Each group belongs to its nearest `DataScope`. Two scopes can therefore use the same group name without sharing values. An explicit group on a descendant creates another isolated group within the same scope.

## Keys

Inside a scope, a Data component resolves its key from:

1. its `data-option-key` option;
2. the native `name` of an `<input>`, `<select>`, or `<textarea>`.

A keyed value updates bindings with the same key and notifies unkeyed [`DataComputed`](../DataComputed/index.md) and [`DataEffect`](../DataEffect/index.md) subscribers. Unscoped Data groups preserve their scalar behavior.

Use `data-option-immediate` on keyed sources to collect their initial values when the components mount. All immediate values mounted in the same tick are collected before subscribers are notified.

## Scoped data

Data callbacks receive the group's `$data` snapshot as their third argument:

```html
<div data-component="DataScope" data-option-group="person">
  <input name="first" value="Ada" data-component="DataModel" data-option-immediate />
  <input name="last" value="Lovelace" data-component="DataModel" data-option-immediate />
  <span data-component="DataComputed" data-option-compute="`${$data.first} ${$data.last}`">
    Ada Lovelace
  </span>
</div>
```

The snapshot object and its array values are frozen. Array and `Date` values are cloned before they are exposed, so mutating the original value does not mutate an existing snapshot. A cloned `Date` can still be changed through its mutation methods, but later snapshots remain isolated from those changes.

## Lifecycle

Scope membership is resolved when a Data component is initialized. Moving a mounted component between scopes or changing its group or key dynamically is not supported.

A keyed [`DataModel`](../DataModel/index.md) is a data source. For non-radio values, every mounted `DataModel` with the same key is tracked as a mirrored source after publication. Destroying one mirrored model keeps the value in `$data`; the key is removed only when its last source is destroyed. Same-key `DataBind`, `DataComputed`, and `DataEffect` instances are subscribers and do not retain the key. A radio key is owned by the model representing its selected value.

Disconnected sources are cleaned up the next time the scope is read or updated. For `[]` groups, the remaining selected values are recomputed before subscribers are notified.
