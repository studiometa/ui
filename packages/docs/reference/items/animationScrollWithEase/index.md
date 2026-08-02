---
badges: [JS, Deprecated]
---

# animationScrollWithEase <Badges :texts="$frontmatter.badges" />

::: warning Deprecated
`animationScrollWithEase` is deprecated. Extend [`ScrollAnimationTarget`](/reference/items/ScrollAnimation/) for new implementations.
:::

The `animationScrollWithEase` decorator adds eased interpolation to a legacy scroll animation class. It remains exported for migration compatibility.

## Migration

Replace a decorated `AbstractScrollAnimation` subclass with a `ScrollAnimationTarget` subclass and configure its interpolation through the current ScrollAnimation API.

See the [ScrollAnimation migration notes](/migration-guides/1.0-2.0/#remove-animationscrollwithease-decorator) and the [current ScrollAnimation reference](/reference/items/ScrollAnimation/).
