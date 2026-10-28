---
title: GsapTimeline JS API
---

# JS API

Compose `GsapStep` descendants into one [GSAP](https://gsap.com) timeline.

## Options

Object options are JSON: quote the keys. JSON cannot contain functions or DOM nodes. The component controls the `paused`, `scrollTrigger` and `callbackScope` keys and the callbacks, and removes them with a `gsap.unsupported-vars` diagnostic.

All options are responsive, and a change rebuilds the timeline once per frame. A rebuild keeps the progress and the playback state, except for a timeline that `scrollTrigger` drives.

### `timeline`

- Type: `GSAP.TimelineVars`
- Default: `{}`

The [timeline variables](https://gsap.com/docs/v3/GSAP/Timeline/#special-properties), for example `defaults`, `delay`, `repeat` or `yoyo`.

<!-- prettier-ignore-start -->
```html {3}
<section
  data-component="GsapTimeline"
  data-option-timeline='{ "defaults": { "duration": 0.6, "ease": "power3.out" }, "repeat": -1, "yoyo": true }'>
  …
</section>
```
<!-- prettier-ignore-end -->

### `scrollTrigger`

- Type: `boolean | ScrollTrigger.Vars`
- Default: `false`

Create a ScrollTrigger for the timeline. It works like the [`scrollTrigger` option of `Gsap`](/reference/items/Gsap/js-api#scrolltrigger): a bare attribute uses the root element as trigger, and the `trigger`, `endTrigger` and `pin` selectors resolve inside the root element.

### `autoplay`

- Type: `boolean`
- Default: `false`

Play the timeline when it is built.

## `GsapStep`

A `GsapStep` declares one tween of its nearest `GsapTimeline` ancestor. Its options are the [`targets`](/reference/items/Gsap/js-api#targets), [`set`](/reference/items/Gsap/js-api#set), [`from`](/reference/items/Gsap/js-api#from) and [`to`](/reference/items/Gsap/js-api#to) options of `Gsap`, plus `at`. The `targets` selector resolves inside the step, and an empty value targets the step element.

A change of the options of a step rebuilds its timeline. A step without `set`, `from` and `to` reports a `gsap.empty-declaration` diagnostic and the timeline skips it.

### `at`

- Type: `string`
- Default: `''`

The [position](https://gsap.com/resources/position-parameter/) of the step in the timeline:

- a number of seconds: `"1.5"`;
- a label: `"intro"`. GSAP adds the label at the end of the timeline when it does not exist yet;
- a relative position: `"<"`, `">"`, `"+=0.5"`, `"-=0.2"`, `"intro+=1"`.

An empty value appends the step at the end of the timeline. The `set` variables of a step go at its position, before its tween.

<!-- prettier-ignore-start -->
```html {5,9}
<section data-component="GsapTimeline" data-option-autoplay>
  <h2 data-component="GsapStep" data-option-from='{ "opacity": 0 }'>…</h2>
  <p
    data-component="GsapStep"
    data-option-at="<"
    data-option-from='{ "opacity": 0, "y": 16 }'>…</p>
  <a
    data-component="GsapStep"
    data-option-at="-=0.2"
    data-option-from='{ "opacity": 0 }'>…</a>
</section>
```
<!-- prettier-ignore-end -->

## Properties

| Property    | Type                          | Description                                                          |
| ----------- | ----------------------------- | -------------------------------------------------------------------- |
| `animation` | `gsap.core.Animation \| null` | The current timeline, or `null` without steps and in reduced motion. |
| `progress`  | `number`                      | The progress of the current timeline, from `0` to `1`.               |
| `duration`  | `number`                      | The duration of the current timeline, in seconds.                    |
| `steps`     | `GsapStep[]`                  | The mounted steps that the timeline owns, in DOM order.              |

A rebuild replaces the timeline: read `animation` when you need it, and do not keep a reference.

## Methods

The timeline has the [methods of `Gsap`](/reference/items/Gsap/js-api#methods): `play()`, `pause()`, `reverse()`, `restart()`, `seek(position)`, `complete()` and `rebuild()`. `seek()` also accepts a label of the timeline. A method called before the timeline is built applies to it when it is built.

## Events

The timeline dispatches the [events of `Gsap`](/reference/items/Gsap/js-api#events): `gsap-ready`, `gsap-play`, `gsap-pause`, `gsap-complete`, `gsap-reverse-complete` and `gsap-interrupt`.

## Lifecycle

- The timeline waits until the DOM settles, so the steps of the markup are mounted when it builds.
- A step added, removed or moved, and a change of the options of a step, rebuild the timeline once per frame.
- The timeline is built in a `gsap.context()`, and a rebuild or an unmount reverts it.
- When the user prefers reduced motion, the timeline does not load GSAP and builds nothing.
