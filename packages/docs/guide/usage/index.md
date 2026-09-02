# Usage

This page is a quickstart for rendering markup and registering behavior. Read the [Concepts](/guide/concepts/) section for the underlying architecture and use the [Reference](/reference/) for exact APIs.

## Registering components

Import the components your page uses and register them with [`registerComponent`](https://js-toolkit-v4.studiometa.dev/api/registry/registerComponent.html) or `registerComponents`:

```js
import { registerComponents } from '@studiometa/js-toolkit';
import { Disclosure, Cursor } from '@studiometa/ui';

registerComponents(Disclosure, Cursor);
```

Registered classes mount on matching `data-component` elements:

```html
<div data-component="Disclosure">…</div>
```

A component mounts on its configured name and on nothing else. When the DOM
uses a different name, subclass the component and declare that name:

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { ScrollTo } from '@studiometa/ui';

class SmoothAnchor extends ScrollTo {
  static config = {
    name: 'SmoothAnchor',
  };
}

registerComponent(SmoothAnchor);
```

::: tip Importing a component does not register it
No `@studiometa/ui` component registers itself: importing a module only defines the class, and the class mounts on nothing until you register it. Every component a page uses needs its `registerComponent()` call, which keeps one readable list of what the page runs. The [autoloader](/guide/autoloading/) is the other way to get there: it registers the whole catalog for you and imports each component the first time the DOM asks for it.
:::

See [Declarative runtime](/guide/concepts/declarative-runtime) for options, refs, events, lifecycle and multiple components on one element.

## Rendering Twig templates

After installing and configuring the Composer package, include templates through the project-aware `@ui` namespace:

```twig
{% include '@ui/Button/Button.twig' with {
  label: 'Click me',
  attr: { class: 'rounded' },
} %}
```

A template can render the `data-component`, options and refs expected by its JavaScript counterpart, but your JavaScript entry point still controls registration.

Use parameters and blocks for supported customization. If the markup itself must change, create the matching relative template path in your project and extend the package implementation through `@ui-pkg`:

```twig
{# templates/Button/Button.twig #}
{% extends '@ui-pkg/Button/Button.twig' %}

{% set attr = (attr|default({}))|merge({
  class: 'rounded bg-blue-600 px-4 py-2 text-white'
}) %}
```

See [Templates and customization](/guide/concepts/templates-and-customization) for namespace lookup, root attributes, overrides and styling ownership.

## Combining markup and behavior

For an item with Twig and JavaScript surfaces, render its template and register its class:

```twig
{% include '@ui/Marquee/CircularMarquee.twig' with {
  id: 'services',
  content: 'Our services',
} %}
```

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { Marquee } from '@studiometa/ui';

registerComponent(Marquee);
```

The badges and API links on each Reference item show which surfaces it supports.

## Next steps

- [Browse components by task](/reference/components/).
- [Learn composition patterns](/guide/concepts/composition).
- [Open the playground](/play/).
