# Usage

This page is a quickstart for rendering markup and registering behavior. Read the [Concepts](/guide/concepts/) section for the underlying architecture and use the [Reference](/reference/) for exact APIs.

## Registering components

Import the components your page uses and register them with [`registerComponent`](https://js-toolkit.studiometa.dev/api/helpers/registerComponent.html) or `registerComponents`:

```js
import { registerComponents } from '@studiometa/js-toolkit';
import { Accordion, Cursor } from '@studiometa/ui';

registerComponents(Accordion, Cursor);
```

Registered classes mount on matching `data-component` elements:

```html
<div data-component="Accordion">…</div>
```

Pass an alias or selector when the DOM uses a different component name:

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { AnchorScrollTo } from '@studiometa/ui';

registerComponent(AnchorScrollTo, 'a[href^="#"]');
```

See [Declarative runtime](/guide/concepts/declarative-runtime) for options, refs, events, lifecycle, multiple components on one element and when to use `createApp`.

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
{% include '@ui/CircularMarquee/CircularMarquee.twig' with {
  id: 'services',
  content: 'Our services',
} %}
```

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { CircularMarquee } from '@studiometa/ui';

registerComponent(CircularMarquee);
```

The badges and API links on each Reference item show which surfaces it supports.

## Next steps

- [Browse components by task](/reference/components/).
- [Learn composition patterns](/guide/concepts/composition).
- [Open the playground](/play/).
