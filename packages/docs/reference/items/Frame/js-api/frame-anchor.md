---
title: FrameAnchor
---

# FrameAnchor

The `FrameAnchor` component extends the [abstract `AbstractFrameTrigger` component](./abstract-frame-trigger.md) and inherits from its APIs.

It will trigger a request on its parent [`Frame` component](./frame.md) when its root `<a>` element is clicked, if no modifier key is pressed while clicking (i.e. to open a link in a new tab or window) and if the target of the link is not `_blank`.
