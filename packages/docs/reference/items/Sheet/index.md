---
badges: [JS]
---

# Sheet <Badges :texts="$frontmatter.badges" />

::: warning Preview
The `Sheet` component is a preview. Its API may change before it is marked as stable.
:::

The `Sheet` component is a swipeable sheet whose gesture is **native scrolling**. The sheet lives in a scroll container with a snap point at each end: opening scrolls it into view, closing scrolls it back out, and a swipe is the user doing that same scroll by hand. There is no touch handling in JavaScript, so the gesture runs off the main thread with the platform's own momentum, elasticity and refresh rate. The animations that follow the gesture — the backdrop opacity, the corner radius — are CSS keyframes driven by a [view timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/view-timeline).

The technique comes from React Aria's article [Scrolling is All You Need: Building a Swipeable Sheet](https://react-aria.adobe.com/blog/sheet).

A `Sheet` is not an overlay of its own. It is a child of [`Dialog`](/reference/items/Dialog/), which runs its `enter()` on open and its `leave()` on close, as it does for a [`Transition`](/reference/items/Transition/) or a [`ViewTransition`](/reference/items/ViewTransition/). The top layer, the focus, the background `inert` and <kbd>Esc</kbd> stay with the native `<dialog>`.

## Usage

Register the components used by the authored HTML:

```js
import { registerComponents } from '@studiometa/js-toolkit';
import { Action, Dialog, Sheet } from '@studiometa/ui';

registerComponents(Action, Dialog, Sheet);
```

The `Sheet` element is the scroller. It holds a closed snap marker, a stage with the backdrop and the `panel` ref, and an open snap marker:

```html
<button type="button" data-component="Action" data-on:click="Dialog(#sheet)->target.open()">
  Open sheet
</button>

<dialog
  id="sheet"
  data-component="Action Dialog"
  data-on:cancel.prevent="Dialog.close()"
  aria-labelledby="sheet-title"
  class="sheet">
  <div data-component="Sheet" class="sheet__scroller">
    <div class="sheet__snap sheet__snap--closed"></div>
    <div class="sheet__stage">
      <div
        data-component="Action"
        data-on:click="Dialog(#sheet)->target.close()"
        class="sheet__backdrop"></div>
      <div data-ref="panel" class="sheet__panel">
        <h2 id="sheet-title">Sheet title</h2>
        <p>Your content here.</p>
      </div>
    </div>
    <div class="sheet__snap sheet__snap--open"></div>
  </div>
</dialog>
```

The library is unstyled: the geometry is your CSS. See [the required CSS](#the-required-css) below, and the [bottom sheet example](./examples.md#bottom-sheet) for a complete version.

## How it works

The scroller is **twice the height of the viewport**, and only its top half is on screen. Its content is three viewport-high blocks:

| Block         | Role                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------- |
| Closed marker | `scroll-snap-align: start`. Scrolled to `0`, it fills the screen and the sheet is off screen.       |
| Stage         | A viewport-sized flex container that holds the backdrop and puts the sheet on its bottom edge.      |
| Open marker   | `scroll-snap-align: end`. Scrolled to the end, it fills the hidden half and the stage is on screen. |

With `scroll-snap-type: y mandatory`, every gesture settles fully open or fully closed.

- **`enter()`** scrolls to the end of the scroll range, the open snap point, and resolves on `scrollend`.
- **`leave()`** scrolls back to `0`. It resolves as soon as the sheet is off screen, after a jump to `0`, and at once when the sheet is already out of view. The panel is usually much shorter than the scroll range, so the end of the scroll moves nothing visible: waiting for it would keep the transparent backdrop over the page, and every tap on it, after the sheet has gone.
- **Swipe to dismiss.** An `IntersectionObserver` watches the `panel`. When it leaves the screen after it was on screen, the `Sheet` calls `close()` on its parent `Dialog`. The `leave()` that close runs then resolves at once: the sheet is already gone, so there is no second animation.

A scroll that does not move fires no `scrollend`, so a scroll that lands at once — already in place, or instant under reduced motion — resolves at once too. A scroll that never sends `scrollend` resolves after one second, so a `Dialog` is never left open waiting for it.

`enter()` scrolls the whole range too, and the first part of that scroll moves the stage through the hidden half: with a short panel, the sheet appears a moment after the click. Scroll snapping applies to programmatic scrolls, so the `Sheet` cannot jump to the point where the panel starts to enter.

## The required CSS

The `Sheet` writes only what its behaviour depends on:

- the `--sheet` view timeline on the `panel` (`view-timeline-name`, `view-timeline-axis: block`, `view-timeline-inset: 0 100dvh`), and `timeline-scope: --sheet` on the root, so the backdrop can use it;
- `overscroll-behavior-y: contain` on the root, unless your CSS already sets a value. The `Dialog` scroll lock is `overflow: hidden` on the page, which iOS does not apply to a scroll chained from an inner scroller.

Everything else is yours to write:

```css
/* A transparent, full-viewport host that clips the bottom half of the scroller. */
.sheet {
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  overflow: clip;
}

.sheet::backdrop {
  background: transparent;
}

.sheet__scroller {
  height: 200dvh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
}

.sheet__snap {
  height: 100dvh;
}

.sheet__snap--closed {
  scroll-snap-align: start;
}

.sheet__snap--open {
  scroll-snap-align: end;
}

.sheet__stage {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100dvh;
}

/* Reaches one viewport up, so it covers the screen at any scroll position. */
.sheet__backdrop {
  position: absolute;
  inset: -100dvh 0 0;
  background: rgb(0 0 0 / 0.5);
}

/* Positioned, so it paints above the backdrop. */
.sheet__panel {
  position: relative;
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
}
```

- **Neutralise the `<dialog>` user-agent styles.** A modal `<dialog>` gets a `max-width`, a `max-height`, a margin, a padding and a border from the browser. The host has to cover the viewport exactly.
- **The backdrop is an element of the stage, not `::backdrop`.** The native pseudo-element cannot use a timeline declared on a descendant. Because it is inside the scroller, a swipe that starts on it scrolls the sheet too.
- **Keep the panel no taller than the screen.** The `entry` range of the timeline ends when the whole panel is in view.

::: danger Never put a `display` utility on the host `<dialog>`
As for any [`Dialog`](/reference/items/Dialog/#the-dialog-gotcha), a `display` value on the `<dialog>` overrides `dialog:not([open]) { display: none }`, and a closed sheet then covers the page.
:::

## Animating with the timeline

The `panel` declares a view timeline named `--sheet`. Its inset removes the hidden bottom half of the scroller, so the timeline tracks what is on screen. Write your keyframes from closed to open and attach them to the `entry` range: a swipe plays them backwards.

```css
@supports (animation-timeline: view()) {
  .sheet__backdrop {
    animation: sheet-backdrop linear both;
    animation-timeline: --sheet;
    animation-range: entry;
  }

  .sheet__panel {
    animation: sheet-radius linear both;
    animation-timeline: --sheet;
    animation-range: entry;
  }
}

@keyframes sheet-backdrop {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes sheet-radius {
  from {
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
  }
  to {
    border-top-left-radius: 1.5rem;
    border-top-right-radius: 1.5rem;
  }
}
```

Put the `animation` shorthand first: it resets `animation-timeline`.

### Without view timelines

Where `animation-timeline: view()` is not supported, the `Sheet` publishes the same progress, from `0` (closed) to `1` (open), as the `--sheet-progress` custom property on its root element. It is measured from layout, so a transform that you drive with it does not change it.

```css
@supports not (animation-timeline: view()) {
  .sheet__backdrop {
    opacity: var(--sheet-progress, 0);
  }

  .sheet__panel {
    border-top-left-radius: calc(0.5rem + 1rem * var(--sheet-progress, 0));
    border-top-right-radius: calc(0.5rem + 1rem * var(--sheet-progress, 0));
  }
}
```

Keep the keyframes inside `@supports (animation-timeline: view())`. Without a timeline, an `animation` with no duration and `both` fill applies its last keyframe permanently, and that would override the fallback.

## Reduced motion

Under `prefers-reduced-motion: reduce`, `enter()` and `leave()` scroll instantly instead of smoothly: the sheet opens and closes without travel. The setting is read on every scroll, so a change during the session applies at once. The gesture itself is the user's own scrolling, so it is not changed.

## Position

The `position` option is `bottom`, and `bottom` is the only position this version implements. Any other value logs a `sheet.unsupported-position` warning and behaves as `bottom`. The option exists so that `top`, `left`, `right` and `center` can be added later without changing the markup of a bottom sheet.

## Browser support

- **View timelines.** Chromium and Safari 26 support `animation-timeline: view()`. Firefox does not support it by default: use the [`--sheet-progress` fallback](#without-view-timelines). Scroll snapping, the swipe and the dismissal work everywhere.
- **`scrollend`.** Safari supports it from 18.2. Before that, `enter()` and `leave()` resolve after a one-second timeout, so a close holds the invisible dialog open a little longer than the scroll.
- **iOS Safari toolbar.** On iOS Safari, more than `100lvh` can be visible, even when the toolbar is collapsed. React Aria offsets the stage and the `IntersectionObserver` by `calc(100lvh - 100svh + 58px)` there, so that a sheet is only reported closed when it is fully hidden. This version does not: test on a device.
- **Software keyboard.** On iOS the keyboard covers the content instead of resizing the viewport, and `dvh` units do not follow it. This version does not handle it: an input near the bottom of the sheet can end up under the keyboard.
- **Desktop Safari momentum.** After a swipe out, React Aria waits for `scrollend` plus 50 ms on desktop Safari before it closes, so that the momentum scroll does not move to what is behind the sheet. This version closes at once.

## Not in this version

- **Intermediate snap points**, with 1 px markers and `scroll-margin-top` inside the sheet.
- **`preventDismissal`**, to keep the sheet on screen while it can still move between snap points.
- **Stacked sheets**, with `timeline-scope` on the root element and `animation-composition: accumulate`.
- **The software keyboard**, through a visual viewport service in `@studiometa/js-toolkit` v4.
- **The other positions**: `top`, `left`, `right` and `center`.

See the [examples](./examples.md) for a live demo, and the [JavaScript API](./js-api.md) for the full list of options, properties and methods.
