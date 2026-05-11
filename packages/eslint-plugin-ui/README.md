# @studiometa/eslint-plugin-ui

[![NPM Version](https://img.shields.io/npm/v/@studiometa/eslint-plugin-ui.svg?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/eslint-plugin-ui/)
[![Downloads](https://img.shields.io/npm/dm/@studiometa/eslint-plugin-ui?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/eslint-plugin-ui/)
[![Size](https://img.shields.io/bundlephobia/minzip/@studiometa/eslint-plugin-ui?style=flat&colorB=3e63dd&colorA=414853&label=size)](https://bundlephobia.com/package/@studiometa/eslint-plugin-ui)
![Codecov](https://img.shields.io/codecov/c/github/studiometa/ui?style=flat&colorB=3e63dd&colorA=414853)

ESLint plugin to help developers discover and use components from [@studiometa/ui](https://ui.studiometa.dev).

## Installation

```bash
npm install --save-dev @studiometa/eslint-plugin-ui
```

## Configuration

### ESLint

Add the recommended config to your `eslint.config.js` (ESLint v9 flat config):

```js
import { ui } from '@studiometa/eslint-plugin-ui';

export default [
  ui.configs.recommended,
  // ...your other config
];
```

To customise individual rule severities, add an override entry after the recommended config:

```js
import { ui } from '@studiometa/eslint-plugin-ui';

export default [
  ui.configs.recommended,
  {
    rules: {
      'ui/prefer-ui-component': 'error',
    },
  },
];
```

### Oxlint

Add the plugin to your `.oxlintrc.json` using the `"ui"` name to get the `ui/` rule prefix:

```json
{
  "jsPlugins": [{ "name": "ui", "specifier": "@studiometa/eslint-plugin-ui" }],
  "rules": {
    "ui/prefer-ui-component": "warn",
    "ui/prefer-transition": "warn",
    "ui/no-manual-fetch": "warn",
    "ui/prefer-data-model": "warn",
    "ui/prefer-action": "warn"
  }
}
```

## Rules

| Rule | Description | Recommended |
| ---- | ----------- | ----------- |
| `ui/prefer-ui-component` | Warn when a class named after a `@studiometa/ui` component extends `Base` directly instead of importing from the library | warn |
| `ui/prefer-transition` | Warn when a `Base` subclass manually implements `open()` and `close()` — suggest `Transition` | warn |
| `ui/no-manual-fetch` | Warn when a `Base` subclass combines `fetch()` with DOM injection — suggest the `Fetch` component | warn |
| `ui/prefer-data-model` | Warn when a `Base` subclass manually syncs input values to the DOM — suggest `DataModel`/`DataEffect` | warn |
| `ui/prefer-action` | Warn when a `Base` subclass only defines a single simple event handler — suggest `Action` | warn |

### `ui/prefer-ui-component`

Detects classes whose name matches a component exported by `@studiometa/ui` (e.g. `Menu`, `Accordion`, `Modal`) that extend `Base` directly. Suggests importing and extending the existing component instead.

```js
// ❌ Incorrect
import { Base } from '@studiometa/js-toolkit';
class Menu extends Base { }

// ✅ Correct
import { Menu } from '@studiometa/ui';
class MyMenu extends Menu { }
```

### `ui/prefer-transition`

Detects `Base` subclasses that manually implement both `open()` and `close()` methods. This pattern is already handled by the `Transition` component.

```js
// ❌ Incorrect
import { Base } from '@studiometa/js-toolkit';
class Drawer extends Base {
  open() { this.$el.classList.add('is-open'); }
  close() { this.$el.classList.remove('is-open'); }
}

// ✅ Correct
import { Transition } from '@studiometa/ui';
class Drawer extends Transition { }
```

### `ui/no-manual-fetch`

Detects `Base` subclasses that combine a `fetch()` call with DOM injection via `innerHTML` or `insertAdjacentHTML`. The `Fetch` component handles this declaratively.

```js
// ❌ Incorrect
import { Base } from '@studiometa/js-toolkit';
class ProductList extends Base {
  async loadMore() {
    const res = await fetch('/products?page=2');
    this.$el.innerHTML = await res.text();
  }
}

// ✅ Correct
import { Fetch } from '@studiometa/ui';
class ProductList extends Fetch { }
```

### `ui/prefer-data-model`

Detects `Base` subclasses with an `onInput*` or `onChange*` method that writes to `this.$refs.*` DOM properties. The `DataModel` and `DataEffect` components handle reactive bindings declaratively.

```js
// ❌ Incorrect
import { Base } from '@studiometa/js-toolkit';
class LiveSearch extends Base {
  onQueryInput() {
    this.$refs.results.innerHTML = '';
  }
}

// ✅ Correct
import { DataModel, DataEffect } from '@studiometa/ui';
```

### `ui/prefer-action`

Detects `Base` subclasses whose only logic is a single simple event handler (`onClick`, `onMouseenter`, etc.) with no other methods. The `Action` component handles this use case declaratively via data attributes.

```js
// ❌ Incorrect
import { Base } from '@studiometa/js-toolkit';
class Toggle extends Base {
  onClick() {
    this.$el.classList.toggle('is-active');
  }
}

// ✅ Correct — use the Action component via data attributes
// <div data-component="Action"
//      data-option-on="click"
//      data-option-target="#panel"
//      data-option-effect="toggle-class:is-active">
```
