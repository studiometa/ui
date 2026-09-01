---
badges: [JS]
---

# Carousel <Badges :texts="$frontmatter.badges" />

The `Carousel` component displays a set of items in a scrollable track. It is built on the [`Indexable` primitive](/reference/items/Indexable/) and relies on native CSS scroll-snap on touch devices, keeping the JavaScript minimal. Pointer drag is added on top for fine-pointer devices (mouse, trackpad) through the optional [`CarouselDrag`](./js-api#carouseldrag) component.

It works horizontally or vertically, exposes the full `Indexable` navigation API (`goTo()`, `goNext()`, `goPrev()`) and emits a `progress` event alongside a `--carousel-progress` CSS custom property you can hook animations onto.

## Table of content

- [Examples](./examples.md)
- [JS API](./js-api.md)
- [Accessibility](#accessibility)

## Usage

A carousel is authored from a few nested components:

- a root `Carousel` element, carrying an `aria-label` or an `aria-labelledby`;
- a `CarouselWrapper` holding the track, which is also the scroll container — add `CarouselDrag` on the same element to enable pointer dragging;
- one `CarouselItem` per slide;
- optional `CarouselBtn` controls to move to the previous, next or a specific item, each with a name of its own.

::: code-group

```js twoslash [app.js]
import { registerComponent } from '@studiometa/js-toolkit';
import { Carousel } from '@studiometa/ui';

registerComponent(Carousel);
```

```twig [carousel.twig]
<div data-component="Carousel" aria-label="Featured products">
  <div data-component="CarouselWrapper CarouselDrag" class="whitespace-nowrap overflow-x-auto snap-x snap-mandatory">
    {% for item in 1..4 %}
      <div data-component="CarouselItem" class="inline-block snap-center">
        #{{ item }}
      </div>
    {% endfor %}
  </div>

  <button type="button" data-component="CarouselBtn" data-option-action="prev">Previous</button>
  <button type="button" data-component="CarouselBtn" data-option-action="next">Next</button>
</div>
```

:::

### Vertical carousel

Set the [`axis`](./js-api#axis) option to `y` to scroll vertically instead of horizontally:

```twig
<div data-component="Carousel" data-option-axis="y">
  ...
</div>
```

## Accessibility

The component implements the [WAI-ARIA carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) for a non-tabbed carousel. Two things you write, everything else is automatic.

### What you write

**A name on the root.** An `aria-label`, or an `aria-labelledby` pointing at a visible heading. Without one, the component logs a `carousel.unnamed` warning in development: a carousel with no name is a group a screen reader user cannot tell from any other on the page.

**A name on every control.** Text inside the button, an `aria-label` or an `aria-labelledby`. A dot with nothing but a background colour is a tab stop with no name; the component logs `carousel.unnamed-btn` for it.

```twig
<div data-component="Carousel" aria-labelledby="products-heading">
  <h2 id="products-heading">Featured products</h2>
  ...
  <button type="button" data-component="CarouselBtn" data-option-action="prev" aria-label="Previous slide">
    {# an icon #}
  </button>
</div>
```

### What the component does

| Element           | Written                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------- |
| `Carousel`        | `role="group"`, unless the markup already has a role                                         |
| `CarouselItem`    | `role="group"`, plus an `aria-label` of `1 of 4` when the slide has no name of its own       |
| `CarouselItem`    | `inert`, on every slide that does not intersect the track                                    |
| `CarouselWrapper` | `tabindex="0"`, a `role` and a name — only when nothing inside the track is focusable        |
| `CarouselWrapper` | `scroll-padding`, mirroring the track's own padding                                          |
| `CarouselBtn`     | `disabled` on a `prev`/`next` at its end, `aria-disabled` on the picker of the current slide |

**Keyboard navigation is the buttons, not the arrow keys.** A `scroll-snap` track does not respond usefully to <kbd>ArrowRight</kbd> — measured in Chromium 151 and Firefox 153, one press scrolls about 40 pixels and snaps straight back, and <kbd>Home</kbd>, <kbd>End</kbd>, <kbd>PageUp</kbd> and <kbd>PageDown</kbd> do nothing at all on the horizontal axis. So ship `CarouselBtn` controls: they are native buttons, they are in the tab order, and the APG's contract for a non-tabbed carousel is <kbd>Tab</kbd> plus the buttons. No handler is bound to the arrow keys, deliberately — a text input inside a slide needs them.

**Off-screen slides are `inert`, not `aria-hidden`.** `aria-hidden` leaves an element fully in the tab order in both engines; `inert` removes it from the tab order and the accessibility tree. The set is computed as every slide that does not intersect the scroll track, so a layout showing two or three slides at once keeps all of them reachable — "everything but the current index" would hide a slide the user is looking at.

**No `aria-roledescription`.** Neither `carousel` on the root nor `slide` on an item. The attribute is not translated by the browser or the screen reader, so an English string is read out verbatim in a French or German page — NVDA spells an unknown word letter by letter. Write it yourself, in your own language, if you want it; the component gives the root the `role` the attribute needs to be honoured, and never overwrites an attribute you wrote.

**No `aria-live` on the track**, in any form, and no `tablist`/`tab` semantics on the pickers. Both are noisy in practice; see the [JS API notes](./js-api#carouselbtn).

**Reduced motion is observed at runtime.** `prefers-reduced-motion: reduce` turns the programmatic smooth scroll into an instant one. The setting is watched, not sampled at startup, so toggling it mid-session takes effect.

### Localising the generated slide name

Slides fall back to a positional name. Change the template with the [`slide-label`](./js-api#slide-label) option:

```twig
<div data-component="Carousel"
  aria-label="Produits en vedette"
  data-option-slide-label="Diapositive {index} sur {total}">
  ...
</div>
```

A slide with an `aria-label` or an `aria-labelledby` of its own keeps it — use that for a real caption, which is always better than a position.
