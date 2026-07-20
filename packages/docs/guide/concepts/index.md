# Concepts

`@studiometa/ui` is a library of primitives and components that you include or copy into a Twig or Vue project. This page explains how the library is built and which words it uses, so the rest of the documentation reads clearly. For installation steps see the [Installation guide](/guide/installation/), and for day-to-day snippets see the [Usage guide](/guide/usage/).

## Two ways a component ships

A component is delivered as a Twig template, a JavaScript class, or both. The badges at the top of each component page show which formats it provides.

- A **Twig template** renders the markup and the [Tailwind CSS](https://tailwind-config.studiometa.dev) classes. It is configured with **parameters** passed through the `with { … }` clause of an `include` or `embed`.
- A **JavaScript component** adds behavior. It is a class from the [`@studiometa/js-toolkit`](https://js-toolkit.studiometa.dev) framework and is configured with **options**.

The two halves meet in the HTML through data attributes:

- `data-component="Name"` mounts the JavaScript class on an element.
- `data-option-<name>="…"` sets an option on that instance.
- `data-ref="name"` marks a child element the instance reads or updates.

A Twig template sets these attributes for you, so a component often works with a Twig `include` on the markup side and a single `import` on the JavaScript side.

## Words this documentation uses

The library reuses a small, fixed vocabulary. Each term means one thing:

- **Component** — a reusable unit, ready to use as is (for example `Modal` or `Slider`).
- **Primitive** — a base class meant to be extended to build your own components, not used directly (for example [`Transition`](/components/Transition/) and [`Sentinel`](/components/Sentinel/)).
- **Decorator** — a higher-order function from `@studiometa/js-toolkit` that adds a behavior to a class (for example `withTransition`).
- **Parameter** — a value passed to a **Twig template**. Twig API pages list parameters.
- **Option** — a value passed to a **JavaScript component**, set in HTML with a `data-option-<name>` attribute. JS API pages list options.

The words _atom_, _molecule_ and _organism_ appear in some component descriptions. They come from [atomic design](https://atomicdesign.bradfrost.com/) and describe only the rough size of a component, from the smallest building block to a full section. They are not a strict classification.

## Behavior without a JavaScript class

Some components let you wire behavior and reactivity straight in your HTML with `data-…` attributes, so you rarely need to write a JavaScript class of your own.

### The `Action` component

[`Action`](/components/Action/) runs a piece of behavior in response to an event — a click, a hover, an input — and can target other components or elements. The effect is declared in a `data-option-effect` or `data-on:<event>` attribute:

```html
<button data-component="Action" data-option-effect="this.classList.toggle('is-active')">
  Toggle
</button>
```

### The `Data` family

Five components add reactivity to plain HTML, without writing a JavaScript class:

- [`DataModel`](/components/DataModel/) reads values from form inputs.
- [`DataBind`](/components/DataBind/) writes a value into the DOM.
- [`DataComputed`](/components/DataComputed/) transforms a value.
- [`DataEffect`](/components/DataEffect/) runs code when a value changes.
- [`DataScope`](/components/DataScope/) groups the above inside one widget.

## Template namespaces

The Twig extension registers three namespaces (see the [Installation guide](/guide/installation/#in-a-twig-project) for setup):

- `@ui` resolves a template first from your project, then from the package. Use it to include a component.
- `@ui-pkg` resolves a template only from the package. Use it when you extend a component, to avoid an infinite inclusion loop.
- `@svg` resolves SVG files the same way `@ui` resolves templates.

## Where to go next

- [Installation](/guide/installation/) — set up the package in a Twig or Vue project.
- [Usage](/guide/usage/) — import a JavaScript component and include a Twig template.
- [Components](/components/) — the full list, each with examples and an API reference.

## Ecosystem

- [@studiometa/js-toolkit](https://js-toolkit.studiometa.dev)
- [@studiometa/tailwind-config](https://tailwind-config.studiometa.dev)
- [@studiometa/twig-toolkit](https://github.com/studiometa/twig-toolkit)
