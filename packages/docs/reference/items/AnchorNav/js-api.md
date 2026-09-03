---
title: AnchorNav JS API
---

# JS API

## AnchorNav

The `AnchorNav` component does not expose any specific JavaScript API.

## AnchorNavLink

The `AnchorNavLink` class implements the features of the [`Transition` primitive](/reference/items/Transition/).

## AnchorNavTarget

The `AnchorNavTarget` class declares the `in-view` [mount strategy](/guide/autoloading/#mount-strategies): it mounts when its section crosses into the viewport and unmounts when it leaves. Set the margin per element with `data-mount="in-view:<rootMargin>"`.
