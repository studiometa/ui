---
name: studiometa-ui-gsap
description: Animate elements declaratively with @studiometa/ui-gsap v2 — Gsap, GsapTimeline and GsapStep components powered by GSAP and ScrollTrigger on @studiometa/js-toolkit v4. Use when code imports @studiometa/ui-gsap, when markup uses data-component="Gsap", "GsapTimeline" or "GsapStep", or when a page needs GSAP tweens, timelines or scroll-triggered animations declared in HTML.
---

# @studiometa/ui-gsap

`@studiometa/ui-gsap` wraps [GSAP](https://gsap.com) in components that you configure from HTML. Options are GSAP tween and timeline variables written as JSON.

This skill matches the installed package version. Read the references in this folder before the online docs.

## References

- [references/index.md](references/index.md): the items of the package.
- `references/items/Gsap/`: one tween with its playback API, events and `scrollTrigger` option.
- `references/items/GsapTimeline/`: `GsapStep` descendants on one timeline, with `at` positions.

## Install and register

```bash
npm install @studiometa/ui-gsap gsap
```

```js
import { registerComponents } from '@studiometa/js-toolkit';
import { Gsap, GsapStep, GsapTimeline } from '@studiometa/ui-gsap';

registerComponents(Gsap, GsapTimeline, GsapStep);
```

```html
<div
  data-component="Gsap"
  data-option-from='{ "opacity": 0, "y": 24, "duration": 0.6 }'
  data-option-autoplay>
  Hello world!
</div>
```

## Rules

- Option values are JSON: quote all object keys and use single quotes around the attribute. JSON cannot contain functions or DOM nodes.
- `from` and `to` give `fromTo()`, `from` alone gives `from()`, `to` alone gives `to()`. `set` applies before the tween.
- `targets` is a selector that resolves inside the component. An empty value targets the root. Never expect a global selector.
- Do not put `paused`, `scrollTrigger`, `callbackScope` or callbacks (`onComplete`…) in the variables: the component removes them. Use the `scrollTrigger` option.
- `scrollTrigger` is `true` (the root is the trigger) or a ScrollTrigger object. Its `trigger`, `endTrigger` and `pin` selectors resolve inside the component.
- The animation stays paused until `play()`, `data-option-autoplay` or a `scrollTrigger` starts it.
- Drive the playback with `Action`: `data-on:click="Gsap->target.play()"`. The methods are `play()`, `pause()`, `reverse()`, `restart()`, `seek(position)`, `complete()` and `rebuild()`.
- The components emit bubbling `gsap-ready`, `gsap-play`, `gsap-pause`, `gsap-complete`, `gsap-reverse-complete` and `gsap-interrupt` events. `event.detail` is `{ animation, progress }`.
- A `GsapStep` belongs to its nearest `GsapTimeline`. Its `at` option is a number, a label or a relative position (`"<"`, `"-=0.2"`).
- Set `autoplay` on the timeline, not on the steps. Steps have no playback.
- The `animation` property is replaced by each rebuild: do not keep a reference.
- When the user prefers reduced motion, nothing is built. Write the starting state in CSS when a flash of the final state matters.
- Keep callback-heavy, computed, WebGL, video, `Flip`, `Draggable` and `SplitText` scenes in a custom component that calls `resolveGsap()`.

## Loading GSAP

`gsap` loads with a dynamic `import()` when the first animation is built, and `gsap/ScrollTrigger` only for a `scrollTrigger` option. To use other modules, inject them once before the components mount:

```js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { provideGsap } from '@studiometa/ui-gsap';

provideGsap({ gsap, ScrollTrigger });
```

## Related skills

- `studiometa-ui`: `Action` and the shared markup rules.
- `studiometa-js-toolkit`: the `Base` class and the component lifecycle.
