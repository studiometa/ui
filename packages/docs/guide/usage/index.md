# Usage

## Using JS components

Import the [JS Toolkit](https://github.com/studiometa/js-toolkit) components from the NPM package and add them to your application or use them to build other components.

```js
// app.js
import { registerComponent } from '@studiometa/js-toolkit';
import { Accordion, Cursor } from '@studiometa/ui';

registerComponent(Accordion);
registerComponent(Cursor);
```

## Registering components

Use [`registerComponent`](https://js-toolkit.studiometa.dev/api/helpers/registerComponent.html) to mount a component on every matching `data-component` element. It is the default way to register components, with no `App` boilerplate:

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { Accordion } from '@studiometa/ui';

registerComponent(Accordion);
```

Pass a name or selector as the second argument when the DOM uses a different `data-component` value, or to bind a component to a CSS selector:

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { AnchorScrollTo } from '@studiometa/ui';

registerComponent(AnchorScrollTo, 'a[href^="#"]');
```

Reach for [`createApp`](https://js-toolkit.studiometa.dev/api/helpers/createApp.html) only when you need app-level orchestration, such as shared `refs`, `on*` handlers or methods that coordinate across children:

```js
import { Base, createApp } from '@studiometa/js-toolkit';
import { Transition } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    refs: ['enterBtn', 'leaveBtn'],
    components: {
      Transition,
    },
  };

  onEnterBtnClick() {
    this.$children.Transition[0].enter();
  }

  onLeaveBtnClick() {
    this.$children.Transition[0].leave();
  }
}

export default createApp(App, document.body);
```

## Using Twig components

Twig components can be used as is in your project by including or embeding them:

```twig
{% include '@ui/Button/Button.twig' with { label: 'Click me' } %}
```

Or they can be extended for customization and propagate the extended version in every other components where they are used:

```twig
{# atoms/Button/Button.twig #}
{% extends '@ui-pkg/Button/Button.twig' %}

{% set attr = attr|default({})|merge({
  class: 'p-4 rounded text-white bg-blue-500'
}) %}
```

::: tip The <code>@ui-pkg</code> namespace
**When extending components, use the `@ui-pkg` namespace instead of `@ui`** to avoid infinite loops. This namespace only points to the templates from the package whereas `@ui` points to both the templates from your project and the package.
:::

## Using Vue components

This package does not have Vue components yet.
