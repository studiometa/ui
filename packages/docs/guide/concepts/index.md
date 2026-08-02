# Concepts

`@studiometa/ui` combines server-rendered markup with declarative JavaScript behavior. This section explains the mental model shared by every package and Reference item. Use the [Guide](/guide/) for task-oriented instructions and the [Reference](/reference/) for exact APIs.

## Mental model

1. **Start with meaningful markup.** Write HTML directly or render a Twig or Liquid template. Native HTML semantics remain the baseline.
2. **Add behavior declaratively.** Register JavaScript component classes once, then connect them to markup with `data-component`, `data-option-*` and `data-ref` attributes.
3. **Compose focused parts.** Ready-to-use components can contain child components, reuse primitives, apply decorators or share an element with another behavior.
4. **Customize at the narrowest boundary.** Prefer options and template parameters first, composition second, and class extension or template overrides only when the public configuration is not enough.

This separation keeps markup visible to the server and browser while JavaScript progressively enhances it.

## Learn the architecture

- [Packages and surfaces](./packages-and-surfaces.md) explains what the NPM and Composer packages provide and how JavaScript, Twig and Liquid differ.
- [Declarative runtime](./declarative-runtime.md) explains registration, data attributes, events, lifecycle and application-level orchestration.
- [Composition](./composition.md) explains components, primitives, decorators, helpers and compound families.
- [Templates and customization](./templates-and-customization.md) explains parameters, blocks, attributes, namespaces, overrides and styling ownership.

## Vocabulary

The documentation uses a small, consistent vocabulary:

- **Reference item** — a documented public concept with one canonical page, such as `Dialog`, `Transition` or `withTransition`.
- **Symbol** — a named public export documented by a Reference item, such as a class, function, type, constant or template.
- **Component** — a ready-to-use interface or behavior solution, such as [`Dialog`](/reference/items/Dialog/) or [`Slider`](/reference/items/Slider/). It can be visual or headless.
- **Primitive** — a low-level, usually headless building block intended primarily for composition, such as [`Transition`](/reference/items/Transition/) or [`Sentinel`](/reference/items/Sentinel/).
- **Decorator** — a higher-order function that adds reusable behavior to a js-toolkit component class, such as [`withTransition`](/reference/items/withTransition/).
- **Helper** — a supported plain function that operates independently of a component class, such as [`viewTransition`](/reference/items/view-transition-helper/).
- **Family** — related symbols that cooperate as one feature, such as `Accordion` and `AccordionItem`.
- **Surface** — the runtime or authoring format through which an item is used: JavaScript, Twig or Liquid.
- **Parameter** — a value passed to a Twig template. Twig API pages document parameters and blocks.
- **Option** — a value passed to a JavaScript component, commonly through a `data-option-*` attribute. JavaScript API pages document options, refs, methods and events.
- **Status** — the support stage of an item or symbol: stable, preview or deprecated.

## Declarative behavior without a custom class

Some components let you express application behavior directly in HTML instead of writing a new JavaScript class.

[`Action`](/reference/items/Action/) runs an effect in response to an event:

```html
<button data-component="Action" data-option-effect="this.classList.toggle('is-active')">
  Toggle
</button>
```

### The Data family

The Data family adds scoped reactivity to plain HTML:

- [`DataModel`](/reference/items/DataModel/) reads values from form controls.
- [`DataBind`](/reference/items/DataBind/) writes values into the DOM.
- [`DataComputed`](/reference/items/DataComputed/) derives values.
- [`DataEffect`](/reference/items/DataEffect/) runs an effect when a value changes.
- [`DataScope`](/reference/items/DataScope/) defines the boundary shared by those components.

Use these components for local declarative state. Use an application component when behavior needs methods, shared refs or coordination across unrelated parts of the page.

## Next steps

- [Install the packages](/guide/installation/).
- [Follow the usage quickstart](/guide/usage/).
- [Browse the complete Reference](/reference/).
