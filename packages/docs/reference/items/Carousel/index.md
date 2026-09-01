---
badges: [JS]
---

# Carousel <Badges :texts="$frontmatter.badges" />

The `Carousel` component displays a set of items in a scrollable track. It is built on the [`Indexable` primitive](/reference/items/Indexable/) and relies on native CSS scroll-snap on touch devices, keeping the JavaScript minimal. Pointer drag is added on top for fine-pointer devices (mouse, trackpad) through the optional [`CarouselDrag`](./js-api#carouseldrag) component.

It works horizontally or vertically, exposes the full `Indexable` navigation API (`goTo()`, `goNext()`, `goPrev()`) and emits a `progress` event alongside a `--carousel-progress` CSS custom property you can hook animations onto.

## Table of content

- [Examples](./examples.md)
- [JS API](./js-api.md)

## Usage

A carousel is authored from a few nested components:

- a root `Carousel` element;
- a `CarouselWrapper` holding the track, which is also the scroll container — add `CarouselDrag` on the same element to enable pointer dragging;
- one `CarouselItem` per slide;
- optional `CarouselBtn` controls to move to the previous, next or a specific item;
- an optional `CarouselPlay` button to rotate the carousel on a timer.

::: code-group

```js twoslash [app.js]
import { registerComponent } from '@studiometa/js-toolkit';
import { Carousel } from '@studiometa/ui';

registerComponent(Carousel);
```

```twig [carousel.twig]
<div data-component="Carousel">
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

### Automatic rotation

A carousel does not rotate on its own. Add a [`CarouselPlay`](./js-api#carouselplay) button — first in the tab order, inside the carousel — and it rotates on a timer that the user can stop, that hovering or focusing the carousel pauses, and that `prefers-reduced-motion` suppresses:

```twig
<div data-component="Carousel">
  <button type="button" data-component="CarouselPlay" data-option-delay="5">
    <span data-ref="label"></span>
  </button>
  ...
</div>
```

`CarouselPlay` is registered separately from `Carousel`, since a carousel that does not rotate should not pay for it:

```js
registerComponents(Carousel, CarouselPlay);
```

### Vertical carousel

Set the [`axis`](./js-api#axis) option to `y` to scroll vertically instead of horizontally:

```twig
<div data-component="Carousel" data-option-axis="y">
  ...
</div>
```
