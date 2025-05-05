# @studiometa/ui

[![NPM Version](https://img.shields.io/npm/v/@studiometa/ui.svg?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/ui/)
[![NPM Next Version](https://img.shields.io/npm/v/@studiometa/ui/next?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/ui/v/next)
[![Downloads](https://img.shields.io/npm/dm/@studiometa/ui?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/ui/)
[![Size](https://img.shields.io/bundlephobia/minzip/@studiometa/ui?style=flat&colorB=3e63dd&colorA=414853&label=size)](https://bundlephobia.com/package/@studiometa/ui)
![Codecov](https://img.shields.io/codecov/c/github/studiometa/ui?style=flat&colorB=3e63dd&colorA=414853)

> 📦 A set of JS and/or Twig components powered by [@studiometa/js-toolkit](https://github.com/studiometa/js-toolkit), [studiometa/twig-toolkit](https://github.com/studiometa/twig-toolkit) and [Tailwind CSS](https://tailwindcss.com/).

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
import { Base, createApp } from '@studiometa/js-toolkit';
import { Action, Frame, Modal, ScrollAnimation, ScrollReveal, Slider } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Action,
      Frame,
      Modal,
      ScrollAnimation,
      ScrollReveal,
      Slider,
    },
  };
}

export default createApp(App);
```

Heads up to [ui.studiometa.dev](https://ui.studiometa.dev) for more informations.

## Contributing

Please read the [contribution docs](https://ui.studiometa.dev/-/guide/contributing/).

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/studiometa/ui)
