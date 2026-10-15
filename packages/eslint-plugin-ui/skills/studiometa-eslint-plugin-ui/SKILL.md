---
name: studiometa-eslint-plugin-ui
description: Configure and fix the rules of @studiometa/eslint-plugin-ui, the ESLint and Oxlint plugin that finds custom @studiometa/js-toolkit code that an existing @studiometa/ui component can replace. Use when a project installs @studiometa/eslint-plugin-ui, when a lint report shows a ui/* rule (ui/prefer-ui-component, ui/prefer-transition, ui/no-manual-fetch, ui/prefer-data-model, ui/prefer-action), or when you add the plugin to eslint.config.js or .oxlintrc.json.
---

# @studiometa/eslint-plugin-ui

The plugin warns when a class that extends the js-toolkit `Base` class does again what a `@studiometa/ui` component already does.

This skill matches the installed package version. The full rule documentation is in [references/guide/eslint-plugin/index.md](references/guide/eslint-plugin/index.md).

## Configure

ESLint v9 flat config:

```js
import { ui } from '@studiometa/eslint-plugin-ui';

export default [ui.configs.recommended];
```

Oxlint: add the plugin with the name `ui` to get the `ui/` rule prefix:

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

## Fix a warning

Do not disable a rule to make the warning go away. Replace the custom code with the component that the rule names:

| Rule                     | Replace with                                                               |
| ------------------------ | -------------------------------------------------------------------------- |
| `ui/prefer-ui-component` | Extend the `@studiometa/ui` component of the same name, not `Base`.        |
| `ui/prefer-transition`   | `Transition` (or `withTransition`) for `open()` / `close()` class changes. |
| `ui/no-manual-fetch`     | `Fetch` for `fetch()` followed by `innerHTML` or `insertAdjacentHTML`.     |
| `ui/prefer-data-model`   | `DataModel` and `DataEffect` for input values copied to the DOM.           |
| `ui/prefer-action`       | `Action` attributes in the HTML for a class with one simple event handler. |

Read the component reference before the change. The `studiometa-ui` skill has the API of each component.
