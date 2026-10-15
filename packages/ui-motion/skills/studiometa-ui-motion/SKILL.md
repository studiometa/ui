---
name: studiometa-ui-motion
description: Animate elements declaratively with @studiometa/ui-motion v2 — Motion, MotionSequence, MotionScrollTimeline and MotionView components powered by motion.dev on @studiometa/js-toolkit v4. Use when code imports @studiometa/ui-motion, when markup uses data-component="Motion" or another Motion* component, or when a page needs keyframe, spring, gesture, sequence or scroll-driven animations.
---

# @studiometa/ui-motion

`@studiometa/ui-motion` wraps [Motion](https://motion.dev) in components that you configure from HTML. Options are Motion keyframes and transitions written as JSON.

This skill matches the installed package version. Read the references in this folder before the online docs.

## References

- [references/index.md](references/index.md): the items of the package.
- `references/items/Motion/`: one animation with its playback API and gestures.
- `references/items/MotionSequence/`: several `Motion` children on one timeline (`at` positions or `stagger`).
- `references/items/MotionScrollTimeline/`: animations bound to the scroll progress of a wrapper.
- `references/items/MotionView/`: DOM updates animated with Motion `animateView()`, an alternative to the `ViewTransition` component of `@studiometa/ui`.

## Install and register

```bash
npm install @studiometa/ui-motion motion
```

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { Motion } from '@studiometa/ui-motion';

registerComponent(Motion);
```

```html
<div
  data-component="Motion"
  data-option-initial='{ "opacity": 0, "y": 24 }'
  data-option-animate='{ "opacity": 1, "y": 0 }'
  data-option-transition='{ "type": "spring", "bounce": 0.3 }'
  data-option-autoplay>
  Hello world!
</div>
```

## Rules

- Option values are JSON: quote all object keys and use single quotes around the attribute.
- Only use options that Motion supports. Read the item `js-api.md`: do not add options from other animation libraries.
- `initial` sets the start state on mount. `animate` plays only with `data-option-autoplay` or when a method starts it.
- Drive the playback with `Action`: `data-on:click="Motion->target.play()"`. The methods are `play()`, `pause()`, `reverse()`, `seek(progress)`, `stop()`, `cancel()`, `complete()` and `animate(keyframes, options)`.
- `hover`, `press` and `inView` options apply keyframes while the state holds, then revert.
- The component emits bubbling `motion-play`, `motion-pause`, `motion-complete`, `motion-cancel` and `motion-stop` events.
- In a `MotionSequence`, leave `autoplay` off on the children and set it on the sequence.

## Loading motion

`motion` loads with a dynamic `import()` when the first animation is built. To use another entry (for example `motion/mini`), inject it once before the components mount:

```js
import { animate } from 'motion/mini';
import { provideMotion } from '@studiometa/ui-motion';

provideMotion({ animate });
```

## Related skills

- `studiometa-ui`: `Action`, `Transition`, `ViewTransition` and the shared markup rules.
- `studiometa-js-toolkit`: the `Base` class and the component lifecycle.
