---
title: Motion examples
---

# Examples

## Action-driven playback

Autoplay is off by default, so the card only moves when asked to. The buttons are [`Action`](/reference/items/Action/) components targeting the `Motion` instance with the arrow syntax, the hover pattern combines `play()` and `reverse()` for a symmetric in/out animation, and the last button runs a one-off spin with `animate()` — clicking Play afterwards returns to the animation declared by the options.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/action/app.twig')"
    :script="() => import('./stories/action/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/action/app.twig
<<< ./stories/action/app.js

:::

</llm-only>

## Full playback control

Every playback method on one animation: `play()`, `pause()`, `reverse()`, `stop()`, `cancel()` and `complete()`, plus a range input scrubbing through the animation with `seek()`. Stop commits the styles the element reached, while cancel reverts it to its pre-animation styles.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/transport/app.twig')"
    :script="() => import('./stories/transport/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/transport/app.twig
<<< ./stories/transport/app.js

:::

</llm-only>

## Reacting to events with `DataBind`

The `motion-*` events bubble, so a single routing [`Action`](/reference/items/Action/) on an ancestor catches all five of them and forwards a label to a [`DataBind`](/reference/items/DataBind/) in a separate subtree — the status text never shares an element with the animation.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/events/app.twig')"
    :script="() => import('./stories/events/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/events/app.twig
<<< ./stories/events/app.js

:::

</llm-only>

## Gestures

The `hover`, `press` and `inView` options apply keyframes while their state holds, through Motion's own gesture functions: hover filters out touch emulation, press responds to pointer and keyboard alike, and in-view uses a real `IntersectionObserver`. When the state ends, a new animation plays forward to the base values of the properties the gesture touched — the base values are read from the element itself, so there is nothing to declare.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/gestures/app.twig')"
    :script="() => import('./stories/gestures/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/gestures/app.twig
<<< ./stories/gestures/app.js

:::

</llm-only>

## Spring entrance and exit for a `Dialog`

The [`Dialog`](/reference/items/Dialog/) component handles the top layer, focus and scroll lock, and both its lifecycle events bubble, so an [`Action`](/reference/items/Action/) can route them: the `open` event plays a spring entrance on the `Motion` box and the `close` event plays it in reverse — physics a CSS transition cannot express. Every closing interaction (button, backdrop, <kbd>Esc</kbd>) just calls `Dialog.close()`.

::: warning The dialog does not wait for the exit
`Dialog` awaits only [what its transition children do](/reference/items/Dialog/js-api#what-the-dialog-waits-for), and a `Motion` is not one of them. The entrance plays in full; the exit is cut off when the native dialog closes. Put the animation on a `Transition` or `ViewTransition` child whenever the dialog has to wait for it.
:::

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/with-dialog/app.twig')"
    :script="() => import('./stories/with-dialog/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/with-dialog/app.twig
<<< ./stories/with-dialog/app.js

:::

</llm-only>

## Scrubbing with `TimerProgress`

A single element carries `Action`, `Motion` and [`TimerProgress`](/reference/items/Timer/): the timer emits a `0 → 1` ratio on every frame, and the co-located `Action` hands it to `Motion.seek()`. The effect folds the ratio into a `0 → 1 → 0` triangle wave (`1 - Math.abs(2 * ratio - 1)`), so one timer cycle yoyos the animation out and back — a looping, pausable, restartable timeline without a line of custom JavaScript. For a plain forward loop, pass the ratio through unchanged; Motion can also yoyo on its own with `data-option-transition='{ "repeat": 10, "repeatType": "reverse" }'`, without any timer.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/with-timer/app.twig')"
    :script="() => import('./stories/with-timer/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/with-timer/app.twig
<<< ./stories/with-timer/app.js

:::

</llm-only>
