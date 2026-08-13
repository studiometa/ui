---
title: MotionScrollTimeline JS API
---

# JS API

The scroll driver for a group of animations: the element's traversal of the viewport defines the timeline, and every [`Motion`](/reference/items/Motion/) child it contains is bound to that progress with Motion's [`scroll()`](https://motion.dev/docs/scroll) — hardware-accelerated where the browser supports `ScrollTimeline`. The children declare their keyframes as usual (arrays give multi-step tracks) and keep their whole playback surface; leave their `autoplay` off (its default) so they do not play before the scroll link takes over.

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

## Options

### `offset`

- Type: `string[]`
- Default: `["start end", "end start"]`

The scroll range, in Motion's [offset syntax](https://motion.dev/docs/scroll#offset): each entry pairs a point of the timeline element with a point of the viewport. The default maps progress `0` to the element entering the viewport and `1` to it leaving.

### `axis`

- Type: `'x' | 'y'`
- Default: `'y'`

The scroll axis driving the timeline.

### `trackContentSize`

- Type: `boolean`
- Default: `false`

Watch the scroll container for content size changes, through Motion's own [`trackContentSize`](https://motion.dev/docs/scroll) option. The scroll range is measured once and re-measured on resize, so content that grows or shrinks **after** mount without resizing anything — lazy-loaded images landing, a filtered list dropping rows, an accordion opening — leaves the timeline mapped to a range the page no longer has. Turn this on there.

It is not free: Motion compares the container's `scrollWidth` and `scrollHeight` on **every frame** for as long as the timeline lives, and each change costs a re-measure. Leave it off when the content settles before the first scroll.

<!-- prettier-ignore-start -->
```html {3}
<section
  data-component="MotionScrollTimeline"
  data-option-track-content-size>
  …
</section>
```
<!-- prettier-ignore-end -->

## Notes

- `scroll()` is not part of `motion/mini`: when the [provided module](/reference/items/Motion/js-api#providing-the-motion-dependency) lacks it, the timeline warns and leaves its children untouched.
- Each child gets its own `scroll()` link, released when the timeline is destroyed.
- `trackContentSize` only changes the JavaScript path: where the browser drives the timeline natively with `ScrollTimeline` or `ViewTimeline`, it reads the live scroll range on its own.
