---
title: Gsap JS API
---

# JS API

Animate elements with one [GSAP](https://gsap.com) tween.

## Options

Object options are JSON: quote the keys (`data-option-to='{ "x": 100 }'`). The variables are the GSAP [tween variables](https://gsap.com/docs/v3/GSAP/Tween/#properties). JSON cannot contain functions or DOM nodes, so callbacks, function-based values and element references are not available.

The component controls some keys, and removes them with a `gsap.unsupported-vars` diagnostic: `paused`, `scrollTrigger` (use the [`scrollTrigger`](#scrolltrigger) option), `callbackScope` and the callbacks (`onStart`, `onComplete`…).

All options are responsive: a change of an option, or of the active breakpoint, rebuilds the tween once per frame. A rebuild keeps the progress and the playback state, except for a tween that `scrollTrigger` drives.

### `targets`

- Type: `string`
- Default: `''`

A CSS selector that resolves inside the root element. An empty value targets the root element. A selector that is not valid, or that matches no element, reports a `gsap.invalid-targets` diagnostic and builds nothing. Selectors never match elements outside the component.

<!-- prettier-ignore-start -->
```html {3}
<ul
  data-component="Gsap"
  data-option-targets="li"
  data-option-from='{ "opacity": 0, "y": 16, "stagger": 0.1 }'>
  <li>…</li>
  <li>…</li>
</ul>
```
<!-- prettier-ignore-end -->

### `set`

- Type: `GSAP.TweenVars`
- Default: `{}`

Variables applied to the targets with `gsap.set()` before the tween is created.

### `from`

- Type: `GSAP.TweenVars`
- Default: `{}`

The starting variables. Without `to`, the component creates a `gsap.from()` tween. A `from` tween applies its starting state when it is created.

### `to`

- Type: `GSAP.TweenVars`
- Default: `{}`

The target variables. Without `from`, the component creates a `gsap.to()` tween. With `from`, it creates a `gsap.fromTo()` tween, and the `to` variables hold the tween settings such as `duration`, `ease` or `stagger`.

<!-- prettier-ignore-start -->
```html {3,4}
<div
  data-component="Gsap"
  data-option-from='{ "opacity": 0 }'
  data-option-to='{ "opacity": 1, "duration": 0.5, "ease": "power2.out" }'>
  …
</div>
```
<!-- prettier-ignore-end -->

A declaration without `set`, `from` and `to` reports a `gsap.empty-declaration` diagnostic. A declaration with `set` only applies it and creates no tween.

### `scrollTrigger`

- Type: `boolean | ScrollTrigger.Vars`
- Default: `false`

Create a [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) for the tween. A bare `data-option-scroll-trigger` uses the root element as trigger. An object gives the ScrollTrigger variables. The `trigger`, `endTrigger` and `pin` selectors resolve inside the root element. The callbacks, `animation` and `containerAnimation` keys are not available.

The component imports `gsap/ScrollTrigger` only when this option is set, and registers it once. When the plugin is not available, for example because [`provideGsap()`](#providing-gsap) did not give it, the component reports a `gsap.missing-scroll-trigger` diagnostic and builds nothing.

<!-- prettier-ignore-start -->
```html {4}
<div
  data-component="Gsap"
  data-option-from='{ "opacity": 0, "y": 48 }'
  data-option-scroll-trigger='{ "start": "top 80%", "toggleActions": "play none none reverse" }'>
  …
</div>
```
<!-- prettier-ignore-end -->

The ScrollTrigger drives the tween, so the `autoplay` option has no effect, and a rebuild reads the progress from the scroll position.

### `autoplay`

- Type: `boolean`
- Default: `false`

Play the tween when it is built. Without it, the tween waits for [`play()`](#methods). When the option becomes `true` after the mount, for example at a responsive breakpoint, the tween plays.

## Properties

The properties read the current tween. A rebuild replaces it, so read them when you need them, and do not keep a reference to the animation.

| Property    | Type                          | Description                                                          |
| ----------- | ----------------------------- | -------------------------------------------------------------------- |
| `animation` | `gsap.core.Animation \| null` | The current tween, or `null` before the build and in reduced motion. |
| `progress`  | `number`                      | The progress of the current tween, from `0` to `1`.                  |
| `duration`  | `number`                      | The duration of the current tween, in seconds.                       |

## Methods

A method called before the tween is built is kept and applies to the tween when it is built.

| Method           | Description                                                     |
| ---------------- | --------------------------------------------------------------- |
| `play()`         | Play forward from the current position.                         |
| `pause()`        | Pause at the current position.                                  |
| `reverse()`      | Play backward from the current position.                        |
| `restart()`      | Play forward from the start.                                    |
| `seek(position)` | Go to a time in seconds or to a label. Keep the playback state. |
| `complete()`     | Go to the end, and pause.                                       |
| `rebuild()`      | Build the tween again from the current options and DOM.         |

<!-- prettier-ignore-start -->
```html
<div data-component="Gsap" data-option-to='{ "x": 100 }'>…</div>

<button data-component="Action" data-on:click="Gsap->target.play()">Play</button>
<button data-component="Action" data-on:click="Gsap->target.reverse()">Reverse</button>
```
<!-- prettier-ignore-end -->

## Events

The events are bubbling `CustomEvent`s on the root element. Their `detail` is a `GsapEventDetail`: `{ animation, progress }`.

| Event                   | Dispatched when                                                      |
| ----------------------- | -------------------------------------------------------------------- |
| `gsap-ready`            | a tween is built.                                                    |
| `gsap-play`             | the playback starts: `autoplay`, `play()`, `reverse()`, `restart()`. |
| `gsap-pause`            | `pause()` pauses the tween.                                          |
| `gsap-complete`         | the tween reaches its end.                                           |
| `gsap-reverse-complete` | the tween reaches its start while it plays backward.                 |
| `gsap-interrupt`        | GSAP kills the tween before it completes.                            |

A rebuild, an unmount or reduced motion reverts the tween without events.

<!-- prettier-ignore-start -->
```html {4}
<div
  data-component="Action Gsap"
  data-option-to='{ "opacity": 1 }'
  data-on:gsap-complete="console.log('done')">
  …
</div>
```
<!-- prettier-ignore-end -->

## Lifecycle

- The tween is built in a [`gsap.context()`](<https://gsap.com/docs/v3/GSAP/gsap.context()>). A rebuild and an unmount revert this context, so the targets get their authored inline styles back.
- When the user prefers reduced motion, the component does not load GSAP and builds nothing. When the preference changes to reduce, the component reverts the tween. When it changes back, the component builds the tween again.
- The component builds after GSAP loads, so the first paint can show the element before its starting state. Write the starting state in your CSS when this flash matters.

## Providing GSAP

By default, the components import `gsap` with a dynamic `import()` when they build, and `gsap/ScrollTrigger` only for a `scrollTrigger` option. To use your own GSAP modules, for example from an import map or a specific version, inject them once, before the components mount:

```js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { provideGsap } from '@studiometa/ui-gsap';

provideGsap({ gsap, ScrollTrigger });
```

After `provideGsap()`, the package never imports `gsap` by specifier, and it never imports a plugin that the call did not give. `provideGsap()` registers the plugins once.

`resolveGsap()` returns the same modules as the components use. Use it in a custom component for an advanced scene:

```js
import { Base } from '@studiometa/js-toolkit';
import { resolveGsap } from '@studiometa/ui-gsap';

class Scene extends Base {
  static config = { name: 'Scene' };

  async mounted() {
    const { gsap, ScrollTrigger } = await resolveGsap({ scrollTrigger: true });
    const context = gsap.context(() => {
      // Build the scene.
    }, this.$el);

    return () => context.revert();
  }
}
```

| Export               | Type                                                          |
| -------------------- | ------------------------------------------------------------- |
| `provideGsap`        | `(dependencies: GsapDependencies) => void`                    |
| `resolveGsap`        | `(options?: ResolveGsapOptions) => Promise<GsapDependencies>` |
| `GsapDependencies`   | `{ gsap: typeof gsap; ScrollTrigger?: typeof ScrollTrigger }` |
| `ResolveGsapOptions` | `{ scrollTrigger?: boolean }`                                 |
| `GsapEventDetail`    | `{ animation: gsap.core.Animation; progress: number }`        |

## Diagnostics

| Code                          | Reported when                                                       |
| ----------------------------- | ------------------------------------------------------------------- |
| `gsap.invalid-targets`        | a selector is not valid or matches no element inside the component. |
| `gsap.unsupported-vars`       | an option contains a key that the component controls.               |
| `gsap.missing-scroll-trigger` | the `scrollTrigger` option is set and the plugin is not available.  |
| `gsap.empty-declaration`      | the options declare no `set`, `from` or `to` variables.             |
| `gsap.build-failed`           | GSAP cannot load or cannot build the animation.                     |
