# Usage

## Using JS components

Import the [JS Toolkit](https://github.com/studiometa/js-toolkit) components from the NPM package and add them to your application or use them to build other components.

```js
// app.js
import { Base, createApp } from '@studiometa/js-toolkit';
import { Modal, Cursor } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Modal,
      Cursor,
    },
  };
}

export default createApp(App, document.body);
```

## Using Twig components

Twig components can be used as is in your project by including or embeding them:

```twig
{% include '@ui/atoms/Button/Button.twig' with { label: 'Click me' } %}
```

Or they can be extended for customization and propagate the extended version in every other components where they are used:

```twig
{# atoms/Button/Button.twig #}
{% extends '@ui-pkg/atoms/Button/Button.twig' %}

{% set attr = attr|default({})|merge({
  class: 'p-4 rounded text-white bg-blue-500'
}) %}
```

::: tip The <code>@ui-pkg</code> namespace
**When extending components, use the `@ui-pkg` namespace instead of `@ui`** to avoid infinite loops. This namespace only points to the templates from the package whereas `@ui` points to both the templates from your project and the package.
:::

## Using Vue components

This package does not have Vue components yet.
