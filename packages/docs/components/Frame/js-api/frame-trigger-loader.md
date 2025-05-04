---
title: FrameTriggerLoader
---

# FrameTriggerLoader
The `FrameTriggerLoader` component extends the [`FrameLoader` component](./frame-loader.md) and inherits its APIs.

The `enter()` method of the component will be called by the parent `FrameForm` or `FrameAnchor` component when a request is started, the `leave()` method when the request has ended, be it successfully or with an error.

::: tip Global loader
If you need a loader which is displayed globally for every requests, have a look at the [`FrameLoader` component](./frame-loader.md).
:::
