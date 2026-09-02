# Templates and customization

Twig templates provide server-rendered markup for many Reference items. Their public contract consists of parameters, blocks, root attributes and namespace-based lookup; JavaScript behavior remains a separate surface registered by the application.

## Include a template

Use the `@ui` namespace for normal includes and embeds:

```twig
{% include '@ui/Button/Button.twig' with {
  label: 'Continue',
  attr: { class: 'w-full' },
} %}
```

Twig API pages document the parameters and blocks accepted by each template. Parameters configure values; blocks replace defined regions of markup.

## Root attributes

Templates expose an `attr` parameter for the root element. Package templates merge three layers:

1. **Default attributes** provide overridable classes or values.
2. **Caller attributes** come from `attr`.
3. **Required attributes** preserve the component contract, such as `data-component`, ARIA relationships or mandatory refs.

Pass application classes, IDs and data attributes through `attr` instead of copying a template only to change its root element:

```twig
{% include '@ui/Figure/Figure.twig' with {
  src: '/images/cover.jpg',
  attr: {
    id: 'newsletter-cover',
    class: 'relative z-50',
  },
} %}
```

The exact merge behavior is documented by each Twig API when it differs from this convention.

## Template namespaces

The Composer extension registers four namespaces:

| Namespace  | Lookup                                            | Use                                                   |
| ---------- | ------------------------------------------------- | ----------------------------------------------------- |
| `@ui`      | Project templates first, package templates second | Normal includes and embeds; enables project overrides |
| `@ui-pkg`  | Package templates only                            | Extending the package implementation from an override |
| `@svg`     | Project SVGs first, package SVGs second           | Normal SVG lookup with project overrides              |
| `@svg-pkg` | Package SVGs only                                 | Accessing the package SVG implementation explicitly   |

Prefer `@ui` and `@svg` in application code. The `-pkg` namespaces deliberately bypass project overrides and should be used only when that is the intended behavior.

## Override a package template

The `@ui` loader checks your configured project template directory before the package. To override `@ui/Button/Button.twig`, create the same relative path in your project:

```text
templates/
└── Button/
    └── Button.twig
```

A complete replacement can define its own markup. To retain the package implementation and adjust its variables or blocks, extend `@ui-pkg` so the parent lookup cannot resolve back to the override:

```twig
{# templates/Button/Button.twig #}
{% extends '@ui-pkg/Button/Button.twig' %}

{% set attr = (attr|default({}))|merge({
  class: 'rounded bg-blue-600 px-4 py-2 text-white'
}) %}
```

Using `@ui` in the `extends` statement would resolve the current override again and create an inclusion loop.

## Prefer supported customization first

Before overriding a template:

1. Check its Twig parameters.
2. Check whether a block exposes the region you need.
3. Pass attributes and classes through `attr`.
4. Embed the template if block replacement is sufficient.
5. Override or extend only when the markup contract itself must change.

Overrides become application-owned code. Revisit them when upgrading to pick up accessibility fixes, new required attributes or structural changes from the package.

## Styling boundary

JavaScript classes do not import a visual theme. Twig templates may include structural classes, Tailwind utilities and styled variants. Your application owns Tailwind configuration, design tokens, global CSS and any classes passed to templates.

“Headless” describes behavior that does not prescribe visual styling. It does not mean every package template renders class-free markup.

## Liquid-authored markup

Liquid examples follow the same declarative DOM contract: render semantic markup, `data-component`, options and refs, then register the JavaScript class. Liquid does not use the Twig namespace or override system described on this page.

## Related concepts

- [Packages and surfaces](./packages-and-surfaces.md)
- [Declarative runtime](./declarative-runtime.md)
- [Installation](/guide/installation/)
