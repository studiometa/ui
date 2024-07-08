---
title: DataModel JavaScript API
outline: deep
---

# DataModel JS API

The `Figure` component extends the [`Transition` primitive](/components/primitives/Transition/) and implements the [`withMountWhenInView` decorator](https://js-toolkit.studiometa.dev/api/decorators/withMountWhenInView.html). It inherits their respective APIs, so make sur have a look at them.

## Options

### `lazy`

- Type: `boolean`
- Default: `false`

Use this options to enable lazy loading while reading the source from the `data-src` attribute of the [`img` ref](#img).


## Refs

### `img`

- Type: `HTMLImageElement`

The `Figure` component should have a ref corresponding to its inner `<img />` element.
