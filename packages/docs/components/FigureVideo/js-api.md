---
title: FigureVideo JS API
outline: deep
---

# JS API

The `FigureVideo` component extends the [`Transition` primitive](/components/Transition/) and implements the [`withMountWhenInView` decorator](https://js-toolkit.studiometa.dev/api/decorators/withMountWhenInView.html). It inherits their respective APIs, so make sur have a look at them.

## Options

### `lazy`

- Type: `boolean`
- Default: `false`

Use this options to enable lazy loading while reading the source from the `data-src` attribute of the [`video` ref](#video)'s sources.

## Refs

### `video`

- Type: `HTMLVideoElement`

The `FigureVideo` component should have a ref corresponding to its inner `<video />` element. This `<video />` element must contain at least one `<source />` element.
