---
title: Motion JS API
---

# JS API

## `Motion`

Animate the component's root element with [Motion](https://motion.dev).

### Options

Object options are parsed as JSON: quote the keys (`data-option-animate='{ "x": 100 }'`). The available keyframes and transition settings are Motion's own — see the [`animate()` documentation](https://motion.dev/docs/animate) for the full vocabulary.

#### `initial`

- Type: `DOMKeyframesDefinition`
- Default: `{}`

Styles applied to the element on mount, before anything plays. Use it to define the starting state of an enter animation without a flash of the final state.

<!-- prettier-ignore-start -->
```html {3}
<div
  data-component="Motion"
  data-option-initial='{ "opacity": 0, "y": 24 }'
  data-option-animate='{ "opacity": 1, "y": 0 }'>
  …
</div>
```
<!-- prettier-ignore-end -->

#### `animate`

- Type: `DOMKeyframesDefinition`
- Default: `{}`

The target keyframes of the animation. They play automatically on mount unless [`autoplay`](#autoplay) is disabled.

#### `transition`

- Type: `AnimationOptions`
- Default: `{}`

Motion's animation options: `duration`, `delay`, `ease`, `type` (`"tween"`, `"spring"`, `"inertia"`), `repeat`, spring physics, etc.

<!-- prettier-ignore-start -->
```html {4}
<div
  data-component="Motion"
  data-option-animate='{ "scale": 1 }'
  data-option-transition='{ "type": "spring", "bounce": 0.3 }'>
  …
</div>
```
<!-- prettier-ignore-end -->

#### `autoplay`

- Type: `boolean`
- Default: `true`

Whether the `animate` keyframes play automatically on mount. Since the default is `true`, use the negated `data-option-no-autoplay` attribute to require an explicit `play()`.

<!-- prettier-ignore-start -->
```html {4}
<div
  data-component="Motion"
  data-option-animate='{ "x": 100 }'
  data-option-no-autoplay>
  …
</div>
```
<!-- prettier-ignore-end -->

#### `hover`

- Type: `DOMKeyframesDefinition`
- Default: `{}`

Keyframes applied while the element is hovered, through Motion's [`hover()`](https://motion.dev/docs/hover) — real hover only, touch emulation is filtered out. When the hover ends, the gesture animation plays backward, returning the element to the styles it had when the gesture began.

<!-- prettier-ignore-start -->
```html {3}
<div
  data-component="Motion"
  data-option-hover='{ "scale": 1.1 }'>
  …
</div>
```
<!-- prettier-ignore-end -->

#### `press`

- Type: `DOMKeyframesDefinition`
- Default: `{}`

Keyframes applied while the element is pressed, through Motion's [`press()`](https://motion.dev/docs/press) — pointer and keyboard alike, so the state is accessible for free. Reverts like `hover` when the press ends.

#### `inView`

- Type: `DOMKeyframesDefinition`
- Default: `{}`

Keyframes applied when the element enters the viewport, through Motion's [`inView()`](https://motion.dev/docs/inview). Reverts when the element leaves, unless [`once`](#once) is set.

<!-- prettier-ignore-start -->
```html {3,4}
<div
  data-component="Motion"
  data-option-initial='{ "opacity": 0, "y": 24 }'
  data-option-in-view='{ "opacity": 1, "y": 0 }'
  data-option-once>
  …
</div>
```
<!-- prettier-ignore-end -->

#### `inViewMargin`

- Type: `string`
- Default: `''`

The viewport margin for the `inView` detection, in CSS margin syntax (e.g. `"-100px"` to trigger 100px inside the viewport).

#### `inViewAmount`

- Type: `'some' | 'all' | number`
- Default: `'some'`

How much of the element must be visible to trigger `inView`: `"some"`, `"all"`, or a `0`–`1` proportion.

#### `once`

- Type: `boolean`
- Default: `false`

When set, the `inView` keyframes play once and the reached styles persist — the element is no longer watched.

::: info Gesture animations are transient
The gesture options animate alongside the declared animation: they never become the [current animation](#methods) and emit no lifecycle events. Like `scroll()`, the gesture functions are not part of `motion/mini` — a gesture option warns and is skipped when the [provided module](#providing-the-motion-dependency) lacks its function.
:::

### Events

All events are dispatched as bubbling `CustomEvent`s on the component's element, so they can be listened to with [`Action`](/reference/items/Action/)'s `data-on:<event>` attribute — either on the same element or on an ancestor. Use the `.stop` modifier to contain them.

| Event             | Fired when                                                                 |
| ----------------- | -------------------------------------------------------------------------- |
| `motion-play`     | a playback starts (`autoplay`, `play()`, `reverse()` or `animate()`).      |
| `motion-pause`    | the current animation is paused.                                           |
| `motion-complete` | the current animation finishes.                                            |
| `motion-stop`     | the current animation is stopped, keeping the styles it reached.           |
| `motion-cancel`   | the current animation is cancelled, reverting to the pre-animation styles. |

<!-- prettier-ignore-start -->
```html {4}
<div
  data-component="Action Motion"
  data-option-animate='{ "opacity": 1 }'
  data-on:motion-complete="console.log('done')">
  …
</div>
```
<!-- prettier-ignore-end -->

### Methods

The component holds a single current animation. `play()` and `reverse()` always drive the animation declared by the options — recreating it when an imperative `animate()` call superseded it — while `pause()`, `seek()`, `stop()`, `cancel()` and `complete()` act on whichever animation is current. `play()`, `reverse()` and `animate()` return a promise that resolves when the animation settles and never rejects.

| Method                        | Description                                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `play()`                      | Play the declared animation forward, creating it on first play. Restarts a finished animation.                                    |
| `reverse()`                   | Play the declared animation backward. When nothing has played yet, it starts from its end.                                        |
| `pause()`                     | Pause the current animation in place.                                                                                             |
| `seek(progress)`              | Jump to a progress between `0` and `1`, creating the declared animation paused when nothing has played yet.                       |
| `animate(keyframes, options)` | Run a one-off animation to arbitrary keyframes; options are merged over `transition`. `play()` returns to the declared animation. |
| `stop()`                      | Stop the current animation and commit the styles reached. The next `play()` creates a fresh animation.                            |
| `cancel()`                    | Cancel the current animation and revert to the pre-animation styles. The next `play()` creates a fresh animation.                 |
| `complete()`                  | Jump the current animation to its end state.                                                                                      |

Methods are callable from an `Action` effect — on the same element or through the target syntax:

<!-- prettier-ignore-start -->
```html {2,3}
<div data-component="Action" data-on:mouseenter="Motion(#logo)->target.play()"
  data-on:mouseleave="Motion(#logo)->target.reverse()">
  <div id="logo" data-component="Motion" data-option-animate='{ "scale": 1.2 }' data-option-no-autoplay>…</div>
</div>
```
<!-- prettier-ignore-end -->

### Getters

| Getter     | Description                                                |
| ---------- | ---------------------------------------------------------- |
| `controls` | The current Motion playback controls, or `null` when idle. |
| `time`     | The current playback time in seconds.                      |
| `duration` | The current animation duration in seconds.                 |
| `progress` | The current playback progress, from `0` to `1`.            |

## `MotionScrollTimeline`

The scroll driver for a group of animations: the element's traversal of the viewport defines the timeline, and every `Motion` child it contains is bound to that progress with Motion's [`scroll()`](https://motion.dev/docs/scroll) — hardware-accelerated where the browser supports `ScrollTimeline`. The children declare their keyframes as usual (arrays give multi-step tracks) and keep their whole playback surface; add `data-option-no-autoplay` so they do not play before the scroll link takes over.

<!-- prettier-ignore-start -->
```html {2,6}
<section
  data-component="MotionScrollTimeline"
  class="h-[300vh]">
  <div
    data-component="Motion"
    data-option-animate='{ "opacity": [0, 1, 0], "y": [80, 0, -80] }'
    data-option-no-autoplay>
    …
  </div>
</section>
```
<!-- prettier-ignore-end -->

### Options

#### `offset`

- Type: `string[]`
- Default: `["start end", "end start"]`

The scroll range, in Motion's [offset syntax](https://motion.dev/docs/scroll#offset): each entry pairs a point of the timeline element with a point of the viewport. The default maps progress `0` to the element entering the viewport and `1` to it leaving.

#### `axis`

- Type: `'x' | 'y'`
- Default: `'y'`

The scroll axis driving the timeline.

### Notes

- `scroll()` is not part of `motion/mini`: when the [provided module](#providing-the-motion-dependency) lacks it, the timeline warns and leaves its children untouched.
- Each child gets its own `scroll()` link, released when the timeline is destroyed.

## `MotionSequence`

Orchestrate the `Motion` children as one animation sequence: each child declares its keyframes as usual, and the sequence composes them — in DOM order — into a single timeline with Motion's [sequencing](https://motion.dev/docs/animate#timeline-sequencing). The whole playback surface applies to the sequence: an [`Action`](/reference/items/Action/) can `play()`, `reverse()` or `seek()` the entire choreography, and a [`MotionScrollTimeline`](#motionscrolltimeline) can scrub it. Give the children `data-option-no-autoplay` — the sequence owns their playback.

<!-- prettier-ignore-start -->
```html {1}
<ul data-component="MotionSequence" data-option-stagger="0.1">
  <li data-component="Motion" data-option-initial='{ "opacity": 0, "y": 16 }' data-option-animate='{ "opacity": 1, "y": 0 }' data-option-no-autoplay>One</li>
  <li data-component="Motion" data-option-initial='{ "opacity": 0, "y": 16 }' data-option-animate='{ "opacity": 1, "y": 0 }' data-option-no-autoplay>Two</li>
</ul>
```
<!-- prettier-ignore-end -->

### Options

#### `stagger`

- Type: `number`
- Default: `0`

Spreads the segments automatically: each child starts `stagger` seconds after the previous one. Without it, segments run one after another (Motion's default).

#### `at` (on the children)

- Type: `string`
- Default: `''`

A child's explicit position in the sequence, taking precedence over `stagger`: a time in seconds (`"2"`), a relative offset (`"-0.2"`), or `"<"` for "with the previous segment". See Motion's [sequencing options](https://motion.dev/docs/animate#timeline-sequencing).

### Notes

- The sequence element's own `transition` option is passed as the sequence-level options (e.g. a shared `duration` or `repeat`).
- Children without `animate` keyframes are skipped.
- Sequences need the full `motion` entry: `motion/mini`'s `animate()` does not support them.

## `MotionView`

Wrap DOM updates in Motion's [`animateView()`](https://motion.dev/docs/animate-view) so the change plays as a view transition. A drop-in alternative to the [`ViewTransition`](/reference/items/ViewTransition/) component — same `enter()`/`leave()`/`toggle()` methods, `state` property, events and `viewTransitionName`/`enterTo`/`leaveTo` options — but the animation is declared with Motion keyframes and transitions (including springs) instead of the `::view-transition-*` CSS pseudo-elements.

<!-- prettier-ignore-start -->
```html {2,3}
<div
  data-component="MotionView"
  data-option-enter-to="is-open"
  data-option-transition='{ "type": "spring", "bounce": 0.3 }'>
  …
</div>

<button data-component="Action" data-on:click="MotionView->target.toggle()">Toggle</button>
```
<!-- prettier-ignore-end -->

### Options

Object options are parsed as JSON: quote the keys (`data-option-new='{ "opacity": [0, 1] }'`).

#### `viewTransitionName`

- Type: `string`
- Default: `''`

Assigned as the element's [`view-transition-name`](https://developer.mozilla.org/en-US/docs/Web/CSS/view-transition-name) on mount, exactly like `ViewTransition`. Optional with `MotionView`: `animateView()` names the subjects it animates automatically.

#### `enterTo`

- Type: `string`
- Default: `''`

Classes describing the shown state. Added on `enter`, removed on `leave`.

#### `leaveTo`

- Type: `string`
- Default: `''`

Classes describing the hidden state. Added on `leave`, removed on `enter`. Usually also the element's initial class so it starts hidden.

#### `transition`

- Type: `ViewTransitionOptions`
- Default: `{}`

The root [`animateView()` options](https://motion.dev/docs/animate-view): a default transition (`duration`, `ease`, `type: "spring"`, …) for every layer of the view transition.

#### `add`

- Type: `string`
- Default: `''`

A selector resolved within the component's element: every matched element becomes an animated subject of the transition. When empty, the element itself is the subject.

#### `new`, `old`, `enter`, `exit`

- Type: `DOMKeyframesDefinition`
- Default: `{}`

Per-layer keyframes applied to each subject, mapping to the builder's [`new()`/`old()`/`enter()`/`exit()` methods](https://motion.dev/docs/animate-view): `new` and `old` animate the new and old views whether the element persists or not, while `enter` and `exit` only fire for a pure newcomer or leaver.

#### `layout`

- Type: `boolean`
- Default: `false`

Enable the layout morph on each subject (the builder's `layout()`), so position and size changes animate smoothly.

### Events

The same events as [`ViewTransition`](/reference/items/ViewTransition/js-api#events), in the same order: `enter`, `enter-start`, `enter-end` around the enter transition and `leave`, `leave-start`, `leave-end` around the leave transition.

### Methods

| Method           | Description                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `enter()`        | Swap `leaveTo` for `enterTo` inside a view transition. Resolves once the animation settles.                   |
| `leave()`        | Swap `enterTo` for `leaveTo` inside a view transition. Resolves once the animation settles.                   |
| `toggle()`       | Toggle between enter and leave, entering first.                                                               |
| `update(mutate)` | The underlying primitive: run any DOM mutation as a view transition configured by the options. Never rejects. |

### Notes

- The mutation is never lost: in browsers without the View Transitions API — or when the animation rejects — the update still applies, only without animation.
- `animateView()` is not part of `motion/mini`: when the [provided module](#providing-the-motion-dependency) lacks it, the component warns and applies updates directly.

## Providing the Motion dependency

By default the component resolves `motion` with a lazy `import()` the first time an animation is built. To control which build is used — a specific version, the smaller `motion/mini` entry, or a module served from an import map or a CDN — inject it once with `provideMotion()` before the components mount:

```js
import { animate } from 'motion/mini';
import { provideMotion } from '@studiometa/ui-motion';

provideMotion({ animate });
```

Once provided, `@studiometa/ui-motion` never imports `motion` by specifier — it uses the instance you handed it. The injected value must satisfy the `MotionModule` type: the subset of the `motion` module the components consume. `resolveMotion()` is also exported to trigger (and await) resolution yourself, for example to preload the module.
