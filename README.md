# @studiometa/ui

[![NPM Version](https://img.shields.io/npm/v/@studiometa/ui.svg?style=flat-square)](https://www.npmjs.com/package/@studiometa/ui/)
[![Size](https://img.shields.io/bundlephobia/minzip/@studiometa/ui?label=size&style=flat-square)](https://bundlephobia.com/package/@studiometa/ui)
[![Dependency Status](https://img.shields.io/librariesio/release/npm/@studiometa/ui?style=flat-square)](https://david-dm.org/studiometa/js-toolkit)
![Codecov](https://img.shields.io/codecov/c/github/studiometa/js-toolkit?style=flat-square)

> 🗃 A set of opiniated, unstyled and accessible components based on [@studiometa/js-toolkit](https://github.com/studiometa/js-toolkit)

## Installation

Install the latest version via NPM:

```bash
npm install @studiometa/ui
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
