# Packages and surfaces

The project publishes behavior, templates and integrations through separate packages. A Reference item's surface describes how it is used; it is not a separate component category.

## Packages

| Package                                                                        | Provides                                                                   | Install when                                                               |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [`@studiometa/ui`](https://www.npmjs.com/package/@studiometa/ui)               | JavaScript classes, decorators, helpers, public types and source templates | You need browser behavior or consume package files from a JavaScript build |
| [`studiometa/ui`](https://packagist.org/packages/studiometa/ui)                | Twig extension, package templates, SVG namespaces and icon management      | Your server renders Twig templates                                         |
| [`@studiometa/ui-mapbox`](https://www.npmjs.com/package/@studiometa/ui-mapbox) | Declarative js-toolkit components for Mapbox GL                            | Your interface contains an interactive Mapbox map                          |
| [`@studiometa/ui-motion`](https://www.npmjs.com/package/@studiometa/ui-motion) | Declarative js-toolkit components for the Motion animation library         | Your interface animates elements with Motion                               |

The JavaScript packages are ESM-only and use [`@studiometa/js-toolkit`](https://js-toolkit.studiometa.dev) as their component runtime. `@studiometa/ui-mapbox` also expects `mapbox-gl`; its geocoder integration has an optional peer dependency. `@studiometa/ui-motion` expects `motion`.

The NPM and Composer distributions use the same template sources from `packages/ui`. NPM exposes those source files to JavaScript build tools, while the Composer extension registers them with Twig through namespace-based lookup. Install the distribution used by your rendering pipeline; projects combining JavaScript behavior with Twig normally install both.

## JavaScript surface

A JavaScript surface is a class, decorator, helper, constant or type exported by an NPM package. Import several symbols from the package root:

```js
import { Action, Dialog, Transition } from '@studiometa/ui';
```

Public component subpaths are also available when a build needs a focused entry point:

```js
import { Dialog } from '@studiometa/ui/Dialog';
```

The [All exports](/reference/all-exports/) view is the canonical inventory of public root exports. The [Types](/reference/types/) view lists public type contracts.

## Twig surface

A Twig surface is a server-rendered template. Templates accept parameters and blocks and expose a root `attr` value for HTML attributes. Install the Composer package to register the `@ui` and `@svg` lookup namespaces, then include templates from your application:

```twig
{% include '@ui/Button/Button.twig' with { label: 'Continue' } %}
```

Twig templates can render structural or Tailwind utility classes and can wire the data attributes expected by a JavaScript component. A template does not automatically register its JavaScript class; your application entry point still controls which behavior is loaded.

## Liquid surface

A Liquid surface documents markup intended for a Liquid environment, primarily Shopify integrations. The package does not provide a Liquid component runtime or installable Liquid template set comparable to its Twig extension. Liquid examples live in this documentation and show application authors how to render markup and data attributes consumed by the corresponding NPM JavaScript behavior.

## Styling ownership

The JavaScript behavior is generally headless: it manages state, events, accessibility attributes and DOM behavior without importing a visual theme. Twig templates range from structural markup to Tailwind-styled variants. They provide useful defaults, not a complete product theme.

The packages do not ship compiled CSS or a Tailwind preset. Template sources contain utility class strings; your application must include the relevant classes in its CSS build. [`@studiometa/tailwind-config`](https://tailwind-config.studiometa.dev) is a separate optional project configuration.

Treat styling as an explicit application concern:

- configure documented style options or template parameters when available;
- pass classes through template attributes and blocks;
- override or extend a Twig template when its markup contract must change;
- include any required Tailwind configuration or application CSS in your own build.

## Framework boundary

The JavaScript packages expose plain TypeScript classes built on js-toolkit. They do not ship Vue component wrappers and do not require Vue. They can be used in any server-rendered or client-rendered project that owns the resulting DOM and registers the components at the appropriate time.

## Related concepts

- [Declarative runtime](./declarative-runtime.md)
- [Templates and customization](./templates-and-customization.md)
- [Installation](/guide/installation/)
