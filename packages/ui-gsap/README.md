# @studiometa/ui-gsap

[![NPM Version](https://img.shields.io/npm/v/@studiometa/ui-gsap.svg?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/ui-gsap/)
[![Downloads](https://img.shields.io/npm/dm/@studiometa/ui-gsap?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/ui-gsap/)

> Vanilla [@studiometa/js-toolkit](https://github.com/studiometa/js-toolkit) components to animate elements declaratively with [GSAP](https://gsap.com).

## Installation

Install the package with its `gsap` peer dependency:

```bash
npm install @studiometa/ui-gsap gsap
```

Register the components that a page uses:

```js
import { registerComponents } from '@studiometa/js-toolkit';
import { Gsap, GsapStep, GsapTimeline } from '@studiometa/ui-gsap';

registerComponents(Gsap, GsapTimeline, GsapStep);
```

Or import the autoload entry, which loads each component when its element is on the page:

```js
import '@studiometa/ui-gsap/autoload';
```

## Providing GSAP

By default, the components import `gsap` with a dynamic `import()` when they build their first animation, and `gsap/ScrollTrigger` only when a `scrollTrigger` option is set. You do not have to configure anything: keep `gsap` installed.

To use your own GSAP modules, for example a specific version or modules from an import map, inject them once, before the components mount:

```js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { provideGsap } from '@studiometa/ui-gsap';

provideGsap({ gsap, ScrollTrigger });
```

After `provideGsap()`, the package never imports `gsap` by specifier, and it never imports a plugin that the call did not give. `resolveGsap()` returns the same modules, for custom components that build advanced scenes.

Read the [documentation](https://ui.studiometa.dev/reference/items/Gsap/) for the usage of the `Gsap`, `GsapTimeline` and `GsapStep` components.

## Agent skills

The package ships the `studiometa-ui-gsap` [agent skill](https://agentskills.io). The skill teaches coding agents how to use the package, and it matches the installed version. Link the skills of your dependencies into your project with the [`skills` CLI](https://github.com/vercel-labs/skills):

```bash
npx skills experimental_sync
```

The command links each skill from `node_modules` into the agent folders (`.agents/skills/`, `.claude/skills/`…). When you update the package, the linked skill updates too. The command also links the `studiometa-js-toolkit` skill when your version of `@studiometa/js-toolkit` ships it.

## Contributing

Please read the [contribution docs](https://ui.studiometa.dev/guide/contributing/).
