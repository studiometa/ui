---
badges: [JS]
---

# Motion <Badges :texts="$frontmatter.badges" />

The `Motion` component animates its root element declaratively with the [Motion](https://motion.dev) library. Describe the animation with the `initial`, `animate` and `transition` options: the `initial` styles are applied on mount, then the `animate` keyframes play on demand — or automatically when autoplay is enabled with `data-option-autoplay`.

The component is a thin, headless playback surface exposing imperative methods that an [`Action`](/reference/items/Action/) can call from any interaction: `play()` and `reverse()` always drive the animation declared by the options, while `animate()` runs a one-off to arbitrary keyframes. All its events bubble, so an ancestor `Action` can catch and route them; use the `.stop` event modifier to contain them in nested setups.

The `motion` peer dependency is resolved with a lazy `import()` the first time an animation is built, so it stays out of your main bundle until needed. See [providing the Motion dependency](./js-api#providing-the-motion-dependency) to inject a specific build such as `motion/mini`.

`Motion` is the playback primitive of `@studiometa/ui-motion`, which also ships [`MotionScrollTimeline`](/reference/items/MotionScrollTimeline/) to drive a group of `Motion` children with the scroll, [`MotionSequence`](/reference/items/MotionSequence/) to compose them into one staggered timeline, and [`MotionView`](/reference/items/MotionView/) to play DOM updates as view transitions.

## Usage

Option values are parsed as JSON, so object keys must be quoted. The animation below plays once on mount, which a preview finishes booting before you look at it — hence the replay button, which calls `play()` to restart it:

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

## Driving the animation with `Action`

Autoplay is off by default, so the playback is yours to control from any interaction — see the [examples](./examples.html) for a complete demo:

<!-- prettier-ignore-start -->
```html
<div
  data-component="Motion"
  data-option-animate='{ "x": 100 }'>
  …
</div>

<button data-component="Action" data-on:click="Motion->target.play()">Play</button>
<button data-component="Action" data-on:click="Motion->target.reverse()">Reverse</button>
```
<!-- prettier-ignore-end -->
