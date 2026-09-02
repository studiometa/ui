# Composition

The library separates ready-to-use solutions from reusable building blocks. Classification describes an item's primary role, not whether it has markup or can mount directly.

## Choose the right abstraction

| Need                                         | Prefer                | Example                                                                                                 |
| -------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------- |
| A complete interaction or interface solution | Component             | [`Dialog`](/reference/items/Dialog/), [`Carousel`](/reference/items/Carousel/)                          |
| Lower-level behavior to compose or extend    | Primitive             | [`Transition`](/reference/items/Transition/), [`Indexable`](/reference/items/Indexable/)                |
| Reusable behavior applied to a class         | Decorator             | [`withTransition`](/reference/items/withTransition/), [`withIndex`](/reference/items/withIndex/)        |
| Local behavior expressed in markup           | Declarative component | [`Action`](/reference/items/Action/), the [Data family](./index.md#the-data-family)                     |
| Coordination across unrelated page features  | Application component | [an ordinary component on the page root](./declarative-runtime.md#when-to-use-an-application-component) |

Start at the highest-level abstraction that satisfies the requirement. Moving to a lower-level primitive or custom class gives more control but also makes the application responsible for more state, structure and accessibility behavior.

## Compound component families

A compound component divides one feature into a root orchestrator and focused children. The root registers child classes through its js-toolkit `components` configuration, and markup declares the hierarchy:

```html
<div data-component="DisclosureGroup" data-option-no-multiple>
  <section data-component="Disclosure">
    <h3><button type="button" data-ref="trigger">Section</button></h3>
    <div data-ref="panel" hidden>…</div>
  </section>
</div>
```

The `Disclosure` family includes its group behavior and public contracts. Other examples include Carousel, Menu, Track and MapboxMap. A family's canonical Reference page documents related symbols together even when consumers can import those symbols independently.

Use an item's **Anatomy** page when its child hierarchy, matching refs or required structure forms part of the contract.

## Co-located components

Several independent behaviors can share one element through a space-separated `data-component` value:

```html
<a data-component="Action Fetch" href="/next-page" data-option-history>Next page</a>
```

Co-location is useful when each behavior can operate independently. Prefer a compound family when children exchange events, inherit configuration or depend on a specific hierarchy.

## Class composition with decorators

A decorator accepts a js-toolkit component class and returns a class with an additional contract:

```js
import { Base } from '@studiometa/js-toolkit';
import { withTransition } from '@studiometa/ui';

class Disclosure extends withTransition(Base) {
  // Disclosure-specific behavior
}
```

Decorators keep cross-cutting behavior reusable without forcing unrelated classes into one inheritance hierarchy. Apply only decorators whose options, refs and lifecycle requirements the component can satisfy.

## Extending primitives

Extend a primitive when it provides the correct state or service model but the application needs a specialized public behavior:

```js
import { Transition } from '@studiometa/ui';

class DisclosureTransition extends Transition {
  open() {
    return this.enter();
  }

  close() {
    return this.leave();
  }
}
```

Before extending, check whether a component already solves the interaction, whether options can configure it, or whether a decorator exposes the same capability with less custom code.

## Customization decision

Use the narrowest supported boundary:

1. Set a documented JavaScript option or Twig parameter.
2. Fill a Twig block or pass root attributes.
3. Compose existing components on the same element or in a documented family.
4. Apply a public decorator or extend a public primitive.
5. Extend or override a package Twig template.
6. Create an application component for cross-feature coordination.
7. Build a new reusable component only when none of the existing contracts fit.

Keeping customization at a public boundary makes upgrades easier and leaves internal implementation details free to change.

## Related concepts

- [Declarative runtime](./declarative-runtime.md)
- [Templates and customization](./templates-and-customization.md)
- [Reference taxonomy](/reference/)
