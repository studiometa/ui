---
title: Figure JS API
outline: deep
---

# JS API

The `Figure` component mixes in the [`Transition` behavior](/reference/items/Transition/) and declares the `in-view` [mount strategy](/guide/autoloading/#mount-strategies), so it mounts when it crosses into the viewport and unmounts when it leaves. It inherits the transition API; see that reference too. Adjust the margin with `data-mount="in-view:<rootMargin>"`.

## Options

### `lazy`

- Type: `boolean`
- Default: `false`

Enables lazy loading. The source is read from the `data-src` attribute of the [`img` ref](#img).

## Refs

### `img`

- Type: `HTMLImageElement`

The `Figure` component should have a ref corresponding to its inner `<img />` element.
