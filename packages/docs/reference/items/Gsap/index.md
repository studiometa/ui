---
badges: [JS]
---

# Gsap <Badges :texts="$frontmatter.badges" />

The `Gsap` component animates elements with one [GSAP](https://gsap.com) tween that you declare in the markup. The `from` and `to` options give a `fromTo()` tween, `from` alone gives a `from()` tween and `to` alone gives a `to()` tween. The `set` variables apply before the tween.

The tween stays paused until `play()`, the `autoplay` option or a `scrollTrigger` starts it. An [`Action`](/reference/items/Action/) can call the playback methods from any interaction, and the `gsap-*` events bubble to an ancestor `Action`.

To compose several tweens on one timeline, use [`GsapTimeline`](/reference/items/GsapTimeline/).

## Installation

`Gsap` ships in the separate `@studiometa/ui-gsap` package, with [`gsap`](https://gsap.com) as a peer dependency:

```bash
npm install @studiometa/ui-gsap gsap
```

Importing a module only defines the class: no component registers itself. Register the ones a page uses, or use the [manifest](/guide/autoloading/) of the package:

```js
import { registerComponents } from '@studiometa/js-toolkit';
import { Action } from '@studiometa/ui';
import { Gsap } from '@studiometa/ui-gsap';

registerComponents(Gsap, Action);
```

The component imports `gsap` when it builds its first tween, and `gsap/ScrollTrigger` only when its `scrollTrigger` option is set. See [providing GSAP](./js-api#providing-gsap) to inject the modules yourself.

## Usage

Option values are JSON, so quote the keys. JSON cannot contain functions or DOM nodes: callbacks, function-based values and element references are not available as options.

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

## Prevent a flash of the final state

The component builds its tween after GSAP loads, so the first paint can show the element before the `from` variables apply. When this flash matters, write the starting state in your CSS too, for example `opacity: 0` on the element. GSAP then animates from the same state.

## Reduced motion

When the user prefers reduced motion, the component does not load GSAP and builds nothing: the element keeps its authored state. When the preference changes, the component reverts its tween or builds it again.

## Advanced scenes

The options cover tweens, stagger, responsive values and `ScrollTrigger`. Keep scenes that need callbacks, computed values, DOM nodes, WebGL, video, `Flip`, `Draggable` or `SplitText` in a custom component, and use [`resolveGsap()`](./js-api#providing-gsap) to share the same GSAP instance.
