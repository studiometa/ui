# @studiometa/ui

[![NPM Version](https://img.shields.io/npm/v/@studiometa/ui.svg?style=flat-square)](https://www.npmjs.com/package/@studiometa/ui/)
[![Size](https://img.shields.io/bundlephobia/minzip/@studiometa/ui?label=size&style=flat-square)](https://bundlephobia.com/package/@studiometa/ui)
[![Dependency Status](https://img.shields.io/librariesio/release/npm/@studiometa/ui?style=flat-square)](https://david-dm.org/studiometa/js-toolkit)
![Codecov](https://img.shields.io/codecov/c/github/studiometa/js-toolkit?style=flat-square)

> 📦 A set of opiniated, unstyled and accessible components based on [@studiometa/js-toolkit](https://github.com/studiometa/js-toolkit)

## Installation

Install the latest version via NPM:

```bash
npm install @studiometa/ui
```

If you need the Twig template as well, install the Twig extension via Composer and load it in your application:

```bash
composer require studiometa/ui
```

## Usage

Import the components from the package as needed:

```js
import { Base, createApp } from '@studiometa/js-toolkit';
import { Modal } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Modal,
    }
  }
}

export default createApp(App, document.body);
```

Heads up to [ui.studiometa.dev](https://ui.studiometa.dev) for more informations.

## Contributing

Clone the project and install the required dependencies. The back-end can be run with [ddev](https://github.com/drud/ddev) which is preconfigured.

```bash
git clone https://github.com:studiometa/ui.git
cd ui/

# Install root dependencies
npm install
ddev start

# Launch the dev environment
npm run docs:dev
```

You can also [open the repository in GitPod](https://gitpod.io/#https://github.com/studiometa/ui) and start the dev environment there.
