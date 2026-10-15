# @studiometa/ui

[![NPM Version](https://img.shields.io/npm/v/@studiometa/ui.svg?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/ui/)
[![Downloads](https://img.shields.io/npm/dm/@studiometa/ui?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/ui/)
[![Size](https://img.shields.io/bundlephobia/minzip/@studiometa/ui?style=flat&colorB=3e63dd&colorA=414853&label=size)](https://bundlephobia.com/package/@studiometa/ui)
![Codecov](https://img.shields.io/codecov/c/github/studiometa/ui?style=flat&colorB=3e63dd&colorA=414853)

> A set of JS and Twig components powered by [@studiometa/js-toolkit](https://github.com/studiometa/js-toolkit), [Tailwind CSS](https://tailwindcss.com/) and
[studiometa/twig-toolkit](https://github.com/studiometa/twig-toolkit).

## Installation

Install the latest version via NPM:

```bash
npm install @studiometa/ui
```

If you need the Twig templates as well, install the Twig extension via Composer and load it in your application:

```bash
composer require studiometa/ui
```

## Usage

Import the components from the package as needed:

```js
import { registerComponents } from '@studiometa/js-toolkit';
import { Action, Carousel, Dialog, Fetch, ScrollReveal } from '@studiometa/ui';

registerComponents(Action, Carousel, Dialog, Fetch, ScrollReveal);
```

Heads up to [ui.studiometa.dev](https://ui.studiometa.dev) for more informations.

## Agent skills

The package ships the `studiometa-ui` [agent skill](https://agentskills.io). The skill teaches coding agents how to use the package, and it matches the installed version. Link the skills of your dependencies into your project with the [`skills` CLI](https://github.com/vercel-labs/skills):

```bash
npx skills experimental_sync
```

The command links each skill from `node_modules` into the agent folders (`.agents/skills/`, `.claude/skills/`…). When you update the package, the linked skill updates too. The command also links the `studiometa-js-toolkit` skill when your version of `@studiometa/js-toolkit` ships it.

## Contributing

Please read the [contribution docs](https://ui.studiometa.dev/guide/contributing/).

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/studiometa/ui)
