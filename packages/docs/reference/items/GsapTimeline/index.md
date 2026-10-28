---
badges: [JS]
---

# GsapTimeline <Badges :texts="$frontmatter.badges" />

The `GsapTimeline` component composes its `GsapStep` descendants into one [GSAP](https://gsap.com) timeline, in DOM order. Each `GsapStep` declares one tween with the options of [`Gsap`](/reference/items/Gsap/), and its `at` option places it in the timeline: a number of seconds, a label or a relative position.

A step belongs to its nearest `GsapTimeline` ancestor only. The timeline builds again when a step is added, removed or moved, and when the options of a step change. A step never loads GSAP and never owns an animation.

The timeline has the playback methods, the `scrollTrigger` option and the `gsap-*` events of `Gsap`.

## Installation

`GsapTimeline` ships in the separate `@studiometa/ui-gsap` package, with [`gsap`](https://gsap.com) as a peer dependency:

```bash
npm install @studiometa/ui-gsap gsap
```

Register both classes, or use the [manifest](/guide/autoloading/) of the package:

```js
import { registerComponents } from '@studiometa/js-toolkit';
import { GsapStep, GsapTimeline } from '@studiometa/ui-gsap';

registerComponents(GsapTimeline, GsapStep);
```

## Usage

Option values are JSON, so quote the keys. JSON cannot contain functions or DOM nodes.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/timeline/app.twig')"
  :script="() => import('./stories/timeline/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/timeline/app.twig
<<< ./stories/timeline/app.js

:::

</llm-only>

## Nested timelines

A `GsapTimeline` inside another `GsapTimeline` owns its own steps, and the outer timeline ignores them. The outer timeline does not add the inner timeline as a child: nested declarative timelines are not supported. Compose them in a custom component with [`resolveGsap()`](/reference/items/Gsap/js-api#providing-gsap).
