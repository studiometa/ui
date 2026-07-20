---
title: Figure JS API
outline: deep
---

# JS API

The `Figure` component extends the [`Transition` primitive](/components/Transition/) and implements the [`withMountWhenInView` decorator](https://js-toolkit.studiometa.dev/api/decorators/withMountWhenInView.html). It inherits their respective APIs. See both linked references.

## Options

### `lazy`

- Type: `boolean`
- Default: `false`

Enables lazy loading. The source is read from the `data-src` attribute of the [`img` ref](#img).

## Refs

### `img`

- Type: `HTMLImageElement`

The `Figure` component should have a ref corresponding to its inner `<img />` element.
