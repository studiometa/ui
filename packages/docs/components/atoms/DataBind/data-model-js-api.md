---
title: DataModel JavaScript API
outline: deep
---

# DataModel JS API

The `DataModel` component have the same public API as the [`DataBind` component](./data-bind-js-api.html).

This component will [dispatch](#dispatch) its current value to all other related instances within the same group when the `input` event is triggered on its root element.

## Methods

### `dispatch()`

Update the value for all related instances based on the current instance value.
