---
title: Timer JS API
---

# JS API

## `Timer`

The base countdown component.

### Options

#### `delay`

- Type: `number`
- Default: `0`

The countdown duration, **in seconds**. `timer-end` is emitted once this delay has elapsed.

<!-- prettier-ignore-start -->
```html {3}
<div
  data-component="Timer"
  data-option-delay="3">
  …
</div>
```
<!-- prettier-ignore-end -->

#### `repeat`

- Type: `boolean`
- Default: `false`

When enabled, the timer re-arms itself after each completion (interval mode), emitting `timer-tick` on every cycle in addition to `timer-end`.

<!-- prettier-ignore-start -->
```html {3}
<div
  data-component="Timer"
  data-option-repeat>
  …
</div>
```
<!-- prettier-ignore-end -->

#### `autostart`

- Type: `boolean`
- Default: `true`

Whether the countdown starts automatically on mount. Since the default is `true`, use the negated `data-option-no-autostart` attribute to require an explicit `start()`.

<!-- prettier-ignore-start -->
```html {3}
<div
  data-component="Timer"
  data-option-no-autostart>
  …
</div>
```
<!-- prettier-ignore-end -->

### Events

All events are dispatched as bubbling `CustomEvent`s on the component's element, so they can be listened to with [`Action`](/components/Action/)'s `data-on:<event>` attribute — either on the same element or on an ancestor. Use the `.stop` modifier to contain them.

| Event          | Fired when                                                        |
| -------------- | ----------------------------------------------------------------- |
| `timer-start`  | the countdown starts (via `start()`, `restart()` or `autostart`). |
| `timer-end`    | the countdown reaches zero.                                       |
| `timer-tick`   | a cycle completes while `repeat` is enabled (after `timer-end`).  |
| `timer-pause`  | the countdown is paused.                                          |
| `timer-resume` | a paused countdown resumes.                                       |
| `timer-stop`   | the countdown is stopped without completing.                      |

<!-- prettier-ignore-start -->
```html {4}
<div
  data-component="Action Timer"
  data-option-delay="5"
  data-on:timer-end="console.log('5 seconds elapsed')">
  …
</div>
```
<!-- prettier-ignore-end -->

### Methods

| Method      | Description                                                        |
| ----------- | ----------------------------------------------------------------- |
| `start()`   | Start — or restart — the countdown from the beginning.            |
| `restart()` | Alias for `start()`.                                              |
| `stop()`    | Stop the countdown without completing it.                         |
| `pause()`   | Pause the countdown, preserving the remaining time.               |
| `resume()`  | Resume a paused countdown from where it left off.                 |

Methods are callable from an `Action` effect when the `Timer` is mounted on the same element:

<!-- prettier-ignore-start -->
```html {4}
<button
  data-component="Action Timer"
  data-option-no-autostart
  data-on:click="Timer.start()">
  Start
</button>
```
<!-- prettier-ignore-end -->

## `TimerProgress`

Extends `Timer` with a continuous progress signal. It inherits every option, event and method above, and adds one event. Mount it in place of `Timer` wherever a smooth indicator is needed; the base `Timer` stays free of the per-frame cost.

### Events

| Event            | Detail        | Fired when                                                    |
| ---------------- | ------------- | ------------------------------------------------------------- |
| `timer-progress` | `[ratio]`     | on every animation frame while running — `ratio` goes `0 → 1`, reaches `1` on completion and resets to `0` on `stop()`. |

The ratio is read from `event.detail[0]`:

<!-- prettier-ignore-start -->
```html {3}
<div
  data-component="Action"
  data-on:timer-progress="DataBind([data-role=progress])->target.set(event.detail[0])">
  <div data-component="TimerProgress" data-option-delay="3">…</div>
  <div data-role="progress" data-component="DataBind" data-bind:style.width="(Number(value || 0) * 100) + '%'"></div>
</div>
```
<!-- prettier-ignore-end -->
