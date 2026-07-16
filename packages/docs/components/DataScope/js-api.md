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

## Action targets

An [`Action`](../Action/index.md) inside a `DataScope` resolves targets only among components in the same nearest scope. An Action outside a scope continues to resolve targets globally.

## Lifecycle

Scope membership is resolved when a Data component is initialized. Moving a mounted component between scopes or changing its group or key dynamically is not supported.

When the last component providing a key is destroyed, that key is removed from the scope's `$data` snapshot.
