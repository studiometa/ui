---
badges: [JS]
---

# MotionSequence <Badges :texts="$frontmatter.badges" />

The `MotionSequence` component orchestrates its [`Motion`](/reference/items/Motion/) children as one animation sequence: each child declares its keyframes as usual, and the sequence composes them — in DOM order — into a single timeline with Motion's [sequencing](https://motion.dev/docs/animate#timeline-sequencing).

The whole playback surface applies to the sequence: an [`Action`](/reference/items/Action/) can `play()`, `reverse()` or `seek()` the entire choreography, and a [`MotionScrollTimeline`](/reference/items/MotionScrollTimeline/) can scrub it. Give the children `data-option-no-autoplay` — the sequence owns their playback.

`MotionSequence` is part of `@studiometa/ui-motion`, alongside [`Motion`](/reference/items/Motion/), [`MotionScrollTimeline`](/reference/items/MotionScrollTimeline/) and [`MotionView`](/reference/items/MotionView/).

## Usage

<!-- prettier-ignore-start -->
```html {1}
<ul data-component="MotionSequence" data-option-stagger="0.1">
  <li data-component="Motion" data-option-initial='{ "opacity": 0, "y": 16 }' data-option-animate='{ "opacity": 1, "y": 0 }' data-option-no-autoplay>One</li>
  <li data-component="Motion" data-option-initial='{ "opacity": 0, "y": 16 }' data-option-animate='{ "opacity": 1, "y": 0 }' data-option-no-autoplay>Two</li>
</ul>
```
<!-- prettier-ignore-end -->

See the [examples](./examples.md) for a live demo, and the [JavaScript API](./js-api.md) for the full list of options.
