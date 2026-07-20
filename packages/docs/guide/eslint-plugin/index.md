# ESLint Plugin

`@studiometa/eslint-plugin-ui` is an ESLint plugin that helps developers discover and use components from `@studiometa/ui` rather than reimplementing them from scratch.

## Installation

```bash
npm install --save-dev @studiometa/eslint-plugin-ui
```

## Configuration

### ESLint

Add the recommended config to your `eslint.config.js` (ESLint v9 flat config):

```js
import { ui } from '@studiometa/eslint-plugin-ui';

export default [ui.configs.recommended];
```

All rules ship at `warn` severity in the recommended config. To override individual rules:

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

| Rule                                             | Description                                                                        | Recommended |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- | ----------- |
| [`ui/prefer-ui-component`](#prefer-ui-component) | Warn when a class named after a `@studiometa/ui` component extends `Base` directly | warn        |
| [`ui/prefer-transition`](#prefer-transition)     | Warn when a `Base` subclass manually implements `open()` and `close()`             | warn        |
| [`ui/no-manual-fetch`](#no-manual-fetch)         | Warn when a `Base` subclass combines `fetch()` with DOM injection                  | warn        |
| [`ui/prefer-data-model`](#prefer-data-model)     | Warn when a `Base` subclass manually syncs input values to the DOM                 | warn        |
| [`ui/prefer-action`](#prefer-action)             | Warn when a `Base` subclass only defines a single simple event handler             | warn        |

### `ui/prefer-ui-component`

Detects classes whose name matches a component exported by `@studiometa/ui` (such as `Menu`, `Accordion`, or `Modal`) that extend `Base` directly. Suggests importing and extending the existing component instead.

```js
// ❌ Incorrect
import { Base } from '@studiometa/js-toolkit';
class Menu extends Base {}

// ✅ Correct
import { Menu } from '@studiometa/ui';
class MyMenu extends Menu {}
```

### `ui/prefer-transition`

Detects `Base` subclasses that manually implement both `open()` and `close()` methods. This pattern is already handled by the [`Transition`](/components/Transition/) component, which manages CSS class transitions declaratively.

```js
// ❌ Incorrect
import { Base } from '@studiometa/js-toolkit';
class Drawer extends Base {
  open() {
    this.$el.classList.add('is-open');
  }
  close() {
    this.$el.classList.remove('is-open');
  }
}

// ✅ Correct
import { Transition } from '@studiometa/ui';
class Drawer extends Transition {}
```

### `ui/no-manual-fetch`

Detects `Base` subclasses that combine a native `fetch()` call with DOM injection via `innerHTML` or `insertAdjacentHTML`. The [`Fetch`](/components/Fetch/) component handles this declaratively.

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
class ProductList extends Fetch {}
```

### `ui/prefer-data-model`

Detects `Base` subclasses with an `onInput*` or `onChange*` method that writes to `this.$refs.*` DOM properties (`textContent`, `innerHTML`, or `value`). The [`DataModel`](/components/DataModel/) and [`DataEffect`](/components/DataEffect/) components handle reactive bindings declaratively without manual wiring.

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

Detects `Base` subclasses whose only logic is a single simple event handler (`onClick`, `onMouseenter`, `onMouseleave`, etc.) with no other methods. The [`Action`](/components/Action/) component handles this use case declaratively via data attributes, without needing a JavaScript class.

```js
// ❌ Incorrect
import { Base } from '@studiometa/js-toolkit';
class Toggle extends Base {
  onClick() {
    this.$el.classList.toggle('is-active');
  }
}
```

```html
<!-- ✅ Correct — use the Action component via data attributes -->
<div
  data-component="Action"
  data-option-on="click"
  data-option-target="#panel"
  data-option-effect="toggle-class:is-active"></div>
```
