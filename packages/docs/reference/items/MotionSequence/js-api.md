---
title: MotionSequence JS API
---

# JS API

Orchestrate the [`Motion`](/reference/items/Motion/) children as one animation sequence: each child declares its keyframes as usual, and the sequence composes them — in DOM order — into a single timeline with Motion's [sequencing](https://motion.dev/docs/animate#timeline-sequencing). The whole playback surface applies to the sequence: an [`Action`](/reference/items/Action/) can `play()`, `reverse()` or `seek()` the entire choreography, and a [`MotionScrollTimeline`](/reference/items/MotionScrollTimeline/) can scrub it. The sequence owns the children's playback — leave their `autoplay` off (its default) and enable it on the sequence itself with `data-option-autoplay` to play on mount.

<!-- prettier-ignore-start -->
```html {1}
<ul data-component="MotionSequence" data-option-stagger="0.1" data-option-autoplay>
  <li data-component="Motion" data-option-initial='{ "opacity": 0, "y": 16 }' data-option-animate='{ "opacity": 1, "y": 0 }'>One</li>
  <li data-component="Motion" data-option-initial='{ "opacity": 0, "y": 16 }' data-option-animate='{ "opacity": 1, "y": 0 }'>Two</li>
</ul>
```
<!-- prettier-ignore-end -->

## Options

`MotionSequence` extends [`Motion`](/reference/items/Motion/), so it also accepts every `Motion` option — `initial`, `animate`, `transition` and `autoplay` among them — and inherits the whole playback surface (`play()`, `reverse()`, `pause()`, `seek()`, `stop()`, `cancel()`, `complete()`) and the `motion-*` events.

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
