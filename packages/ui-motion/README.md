# @studiometa/ui-motion

[![NPM Version](https://img.shields.io/npm/v/@studiometa/ui-motion.svg?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/ui-motion/)
[![Downloads](https://img.shields.io/npm/dm/@studiometa/ui-motion?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/ui-motion/)

> Vanilla [@studiometa/js-toolkit](https://github.com/studiometa/js-toolkit) components to animate elements declaratively with [Motion](https://motion.dev).

## Installation

Install the package along with its `motion` peer dependency:

```bash
npm install @studiometa/ui-motion motion
```

## Usage

Register the component, then author the animation declaratively in your markup. Option values are parsed as JSON, so object keys must be quoted:

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
  data-option-transition='{ "type": "spring", "bounce": 0.3 }'>
  Hello world!
</div>
```

The `initial` styles are applied on mount, then the `animate` keyframes play automatically. Disable the automatic playback with `data-option-no-autoplay` and drive the animation from an [`Action`](https://ui.studiometa.dev/reference/items/Action/) instead:

```html
<div data-component="Motion" data-option-animate='{ "x": 100 }' data-option-no-autoplay>...</div>

<button data-component="Action" data-on:click="Motion->target.play()">Play</button>
<button data-component="Action" data-on:click="Motion->target.reverse()">Reverse</button>
<button data-component="Action" data-on:click="Motion->target.animate({ rotate: 360 })">
  Spin
</button>
```

The playback API is `play()`, `pause()`, `reverse()`, `seek(progress)`, `stop()`, `cancel()`, `complete()` and `animate(keyframes, options)`. The component emits bubbling `motion-play`, `motion-pause`, `motion-complete`, `motion-cancel` and `motion-stop` events an ancestor `Action` can catch and route.

The `hover`, `press` and `inView` options apply keyframes while their state holds (through Motion's touch-filtered, keyboard-accessible gesture functions) and revert when it ends:

```html
<div data-component="Motion" data-option-hover='{ "scale": 1.1 }'>Hover me</div>
```

`MotionSequence` composes its `Motion` children into one timeline (with per-child `at` positions or an automatic `stagger`), and the whole playback surface drives the sequence. For scroll-driven animations, wrap `Motion` components in a `MotionScrollTimeline`: the wrapper's traversal of the viewport defines the timeline and every child is bound to that progress with Motion's `scroll()`, hardware-accelerated where the browser supports `ScrollTimeline`:

```html
<section data-component="MotionScrollTimeline" class="h-[300vh]">
  <div
    data-component="Motion"
    data-option-animate='{ "opacity": [0, 1, 0] }'
    data-option-no-autoplay>
    ...
  </div>
</section>
```

## Providing `motion`

By default the component resolves `motion` with a lazy `import()` the first time an animation is built, so the dependency stays out of your main bundle until it is needed. You never have to configure anything for the default to work — just keep `motion` installed.

When you need to control which `motion` the component uses — a specific version, the smaller `motion/mini` entry, or a module served from an import map or a CDN — inject your own instance once, before the components mount:

```js
import { animate } from 'motion/mini';
import { provideMotion } from '@studiometa/ui-motion';

provideMotion({ animate });
```

Once provided, `@studiometa/ui-motion` never imports `motion` by specifier — it uses the instance you handed it. `resolveMotion()` is also exported if you want to trigger (and await) resolution yourself, for example to preload the module.

Heads up to [ui.studiometa.dev](https://ui.studiometa.dev/reference/items/Motion/) for the full documentation.

## Contributing

Please read the [contribution docs](https://ui.studiometa.dev/guide/contributing/).
