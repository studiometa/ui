---
badges: [JS]
---

# Timer <Badges :texts="$frontmatter.badges" />

The `Timer` atom is a headless countdown primitive. It emits DOM events for its lifecycle — `timer-start`, `timer-end`, `timer-tick`, `timer-pause`, `timer-resume`, `timer-stop` — and exposes imperative methods, holding no UI state of its own. Combine it with [`Action`](/components/Action/) to react to those events or call its methods, and with the [`Data*`](/components/DataScope/) family to turn them into reactive state.

All events bubble, so an ancestor `Action` can catch and route them (see [the progress bar example](./examples.html)); use the `.stop` event modifier to contain them in nested setups.

## Usage

In the following example, a single element carries both `Action` and `Timer`: clicking it restarts a three-second countdown, and the `timer-start` / `timer-end` events update its label.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/basic/app.twig')"
  :script="() => import('./stories/basic/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/basic/app.twig
<<< ./stories/basic/app.js

:::

</llm-only>

## Continuous progress

The `TimerProgress` component extends `Timer` with a smooth, pause-aware `timer-progress` event (a `0 → 1` ratio) emitted on every animation frame. It is a separate component so the base `Timer` never pays the per-frame cost — mount `TimerProgress` only where a continuous indicator is needed. See the [examples](./examples.html) for a progress bar driven through `Action` and `DataBind`.
