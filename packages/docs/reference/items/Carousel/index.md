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
- optional `CarouselBtn` controls to move to the previous, next or a specific item.

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

### Vertical carousel

Set the [`axis`](./js-api#axis) option to `y` to scroll vertically instead of horizontally:

```twig
<div data-component="Carousel" data-option-axis="y">
  ...
</div>
```
