---
name: studiometa-ui
description: Build interfaces with @studiometa/ui v2 — headless, accessible components and Twig templates on @studiometa/js-toolkit v4 (Action, Dialog, Disclosure, Tabs, Carousel, Fetch, Data*, Transition, Figure…). Use when code imports @studiometa/ui, when markup uses data-component, data-option-* or data-on:* attributes for these components, when templates include @ui/ or @ui-pkg/ Twig templates, or before writing a custom modal, accordion, tabs, slider, menu or similar widget.
---

# @studiometa/ui

`@studiometa/ui` is a library of headless, accessible components built on `@studiometa/js-toolkit` v4. The HTML declares the behavior with `data-component`, `data-option-*` and `data-ref` attributes. The JavaScript registers the classes. The Composer package `studiometa/ui` adds Twig templates.

This skill matches the installed package version. Read the references in this folder before the online docs: the online docs can describe another major version.

## References

- [references/index.md](references/index.md): every component, primitive, decorator and helper, with a one-line summary. Read it first to find an existing solution.
- `references/items/<Name>/index.md`: usage and anatomy. `js-api.md`: options, refs, events and methods. `twig-api.md`: template parameters. `examples.md`: complete HTML and JavaScript examples.
- `references/guide/`: installation, usage, autoloading and concepts.

## Rules

1. Before you write a custom widget, look for an item in `references/index.md`. Use it as is, then configure it with options, then extend it. Write custom code last.
2. Read the item `js-api.md` before you write options, refs or event names. Do not guess them.
3. Start from native elements (`<button>`, `<a>`, `<dialog>`, `<details>`, `<form>`). The components add behavior on top of the platform semantics. Keep an accessible name on icon-only buttons and links.
4. Keep the markup meaningful before the JavaScript mounts.

## Register components

No component registers itself. Importing a class only defines it. Register each class the page uses:

```js
import { registerComponents } from '@studiometa/js-toolkit';
import { Action, Dialog, Transition } from '@studiometa/ui';

registerComponents(Action, Dialog, Transition);
```

- A class mounts only on elements whose `data-component` contains its configured name. To use another name, subclass it and set `static config = { name: 'SiteDialog' }`.
- js-toolkit v4 has no `createApp()`. An application component is an ordinary component registered with `registerComponent()`. Write one only when the page root must coordinate several children.
- Without a bundler, or to load components on demand, import the side-effect entry `@studiometa/ui/autoload` once. It registers the full catalog and imports each component when the DOM uses it. See `references/guide/autoloading/index.md`.

## Markup contract

```html
<div data-component="Timer" data-option-delay="3" data-option-no-autostart></div>
```

- Put several components on one element with spaces: `data-component="Action Dialog"`.
- Option attributes use kebab case. The JavaScript API uses camel case.
- Boolean options: the attribute presence sets `true` when the default is `false`. Use `data-option-no-<name>` to set `false` when the default is `true`. The value `="false"` does not set `false`.
- Array and object options use valid JSON in single-quoted attributes: `data-option-intersection-observer='{ "rootMargin": "100px" }'`.
- `data-ref="name"` marks one element. `data-ref="items[]"` adds an element to a collection. Prefix the ref with the component name (`data-ref="Menu.btn"`) when two components can own it.

## Actions and events

`Action` connects DOM events to component methods without custom JavaScript:

```html
<button type="button" data-component="Action" data-on:click="Dialog(#my-dialog)->target.open()">
  Open
</button>
```

`Name(selector)` selects the target components, `->target` names them in the effect. Read `references/items/Action/` for modifiers (`.prevent`, `.stop`, debounce), several targets and the `Target` component.

Component events use kebab case with the family name as a prefix (`disclosure-open`, `in-view`). They bubble. A parent component handles them with `on<ComponentName><EventName>({ target, payload })` hooks, where `payload` is the event detail.

## Twig templates

The Composer package registers the `@ui` and `@ui-pkg` namespaces (and `@svg`, `@svg-pkg`). `@ui` looks in the project templates first, then in the package. `@ui-pkg` always reads the package.

```twig
{% include '@ui/Button/Button.twig' with { label: 'Click me', attr: { class: 'rounded' } } %}
```

To change the markup of a template, create the same relative path in the project templates and extend `@ui-pkg/...`. Templates render markup only: register the matching JavaScript class too.

## Related skills

- `studiometa-js-toolkit`: the `Base` class, lifecycle, services and decorators that all components use.
- `studiometa-ui-mapbox`, `studiometa-ui-motion` and `studiometa-ui-gsap`: the Mapbox, Motion and GSAP component packages.
