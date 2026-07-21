---
title: AnchorNav anatomy
---

# Anatomy

`AnchorNav` is a compound component pairing navigation links with the sections they point to. Each link is matched to a target through the anchor's `href` and the target's `id`. Use this map to see which parts exist and how they nest.

## Structure

```
AnchorNav                                data-component="AnchorNav"
├─ AnchorNavLink    (× n)                data-component="AnchorNavLink"    <a href="#item-1">
└─ AnchorNavTarget  (× n)                data-component="AnchorNavTarget"  <div id="item-1">
```

## Parts

| Part | Selector | Required | Role |
| --- | --- | --- | --- |
| Root | `data-component="AnchorNav"` | Yes | Connects each link to its target and toggles the active link. |
| Link | `data-component="AnchorNavLink"` | Yes (× n) | An anchor whose `href="#id"` matches a target. Accepts [`withTransition`](../Transition/#transition) options. |
| Target | `data-component="AnchorNavTarget"` | Yes (× n) | A section whose `id` matches a link. Accepts [`withMountWhenInView`](https://js-toolkit.studiometa.dev/api/decorators/withMountWhenInView.html) options. |

A link and its target are paired when the link's `href` (minus the `#`) equals the target's `id`.

See the [JavaScript API](./js-api.md) for the options exposed by each part.
