---
title: DataModel JavaScript API
outline: deep
---

# DataModel JS API

The `DataModel` component has the same public API as the [`DataBind` component](../DataBind/js-api.md).

It [dispatches](#dispatch) its current value to related instances in the same group when an `input` event is triggered on its root element.

## Keyed and mirrored models

Inside a [`DataScope`](../DataScope/index.md), a `DataModel` is a source for its resolved key. Non-radio models with the same key mirror each other and jointly retain the value in the scope:

```html
<div data-component="DataScope" data-option-group="profile">
  <input name="first" value="Ada" data-component="DataModel" data-option-immediate />
  <input name="first" data-component="DataModel" />
  <output data-component="DataBind" data-option-key="first">Ada</output>
</div>
```

Destroying one mirrored model does not remove the value from `$data`. The key is removed only after its last `DataModel` source is destroyed.

## Methods

### `dispatch()`

Update the value for all related instances based on the current instance value.
