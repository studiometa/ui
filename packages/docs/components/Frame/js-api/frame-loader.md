---
title: FrameLoader
---

# FrameLoader

The `FrameLoader` component extends the [`Transition` component](/components/Transition/) and inherits its APIs, with the exception of the [`enterKeep`](/components/Transition/js-api.md#enterkeep) and [`leaveKeep`](/components/Transition/js-api.md#/components/Transition/js-api.md#enterkeep) options which are force to be always `true`.

The `enter()` method of the component will be called by the parent `Frame` component when a request is started, the `leave()` method when the request has ended, be it successfully or with an error.

::: tip Fine grain loaders
If you need a loader which is displayed only for a request coming from a specific trigger (a [`FrameForm`](./frame-form.md) or [`FrameAnchor`](./frame-anchor.md) component), have a look at the [`FrameTriggerLoader` component](./frame-trigger-loader.md).
:::
