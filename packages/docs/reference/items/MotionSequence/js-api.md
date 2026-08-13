---
title: MotionSequence JS API
---

# JS API

Orchestrate the [`Motion`](/reference/items/Motion/) children as one animation sequence: each child declares its keyframes as usual, and the sequence composes them — in DOM order — into a single timeline with Motion's [sequencing](https://motion.dev/docs/animate#timeline-sequencing). The whole playback surface applies to the sequence: an [`Action`](/reference/items/Action/) can `play()`, `reverse()` or `seek()` the entire choreography, and a [`MotionScrollTimeline`](/reference/items/MotionScrollTimeline/) can scrub it. Give the children `data-option-no-autoplay` — the sequence owns their playback.

<!-- prettier-ignore-start -->
```html {1}
<ul data-component="MotionSequence" data-option-stagger="0.1">
  <li data-component="Motion" data-option-initial='{ "opacity": 0, "y": 16 }' data-option-animate='{ "opacity": 1, "y": 0 }' data-option-no-autoplay>One</li>
  <li data-component="Motion" data-option-initial='{ "opacity": 0, "y": 16 }' data-option-animate='{ "opacity": 1, "y": 0 }' data-option-no-autoplay>Two</li>
</ul>
```
<!-- prettier-ignore-end -->

## Options

### `stagger`

- Type: `number`
- Default: `0`

Spreads the segments automatically: each child starts `stagger` seconds after the previous one. Without it, segments run one after another (Motion's default).

### `at` (on the children)

- Type: `string`
- Default: `''`

A child's explicit position in the sequence, taking precedence over `stagger`: a time in seconds (`"2"`), a relative offset (`"-0.2"`), or `"<"` for "with the previous segment". See Motion's [sequencing options](https://motion.dev/docs/animate#timeline-sequencing).

## Notes

- The sequence element's own `transition` option is passed as the sequence-level options (e.g. a shared `duration` or `repeat`).
- Children without `animate` keyframes are skipped.
- Sequences need the full `motion` entry: `motion/mini`'s `animate()` does not support them. See [providing the Motion dependency](/reference/items/Motion/js-api#providing-the-motion-dependency).
