---
badges: [JS]
---

# MotionScrollTimeline <Badges :texts="$frontmatter.badges" />

The `MotionScrollTimeline` component is the scroll driver for a group of animations: the element's traversal of the viewport defines the timeline, and every [`Motion`](/reference/items/Motion/) child it contains is bound to that progress with Motion's [`scroll()`](https://motion.dev/docs/scroll) — hardware-accelerated where the browser supports `ScrollTimeline`.

The children declare their keyframes as usual (arrays give multi-step tracks) and keep their whole playback surface; leave their `autoplay` off (its default) so they do not play before the scroll link takes over. Registering the timeline is enough: it declares `Motion` in `config.components`, so `registerComponent(MotionScrollTimeline)` registers both. See [installation](/reference/items/Motion/#installation).

`MotionScrollTimeline` is part of `@studiometa/ui-motion`, alongside [`Motion`](/reference/items/Motion/), [`MotionSequence`](/reference/items/MotionSequence/) and [`MotionView`](/reference/items/MotionView/).

## Usage

<!-- prettier-ignore-start -->
```html {2,6}
<section
  data-component="MotionScrollTimeline"
  class="h-[300vh]">
  <div
    data-component="Motion"
    data-option-animate='{ "opacity": [0, 1, 0], "y": [80, 0, -80] }'>
    …
  </div>
</section>
```
<!-- prettier-ignore-end -->

See the [examples](./examples.md) for a live demo, and the [JavaScript API](./js-api.md) for the full list of options.
