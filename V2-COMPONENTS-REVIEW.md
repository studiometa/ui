# v2 component review

Full inventory of the public surface of the `ui` packages, for the js-toolkit v4 / ui v2 major version.

Legend:

- `[deprecated]` — already marked `@deprecated` in v1
- `[twig]` — Twig template only, no TypeScript class
- `[ts+twig]` — TypeScript class with a Twig template
- `[abstract]` — not a declarative component, only a base class to extend
- `[shopify]` / `[twicpics]` — third party integration variant

## Review decisions (round 2)

Answers to the round-1 comments, verified against source:

- **Accordion family** (Accordion, AccordionItem) — checked against `Disclosure`/`DisclosureGroup`: clean supersession. `Disclosure` covers everything `AccordionItem` does (open/close, transitions, ARIA sync) plus independent self-registration and `Transition`/`ViewTransition` integration `AccordionItem` never got, and `DisclosureGroup`'s `multiple`/`collapsible` options already express "accordion" as one configuration (`multiple: false, collapsible: true`) rather than a separate component. **Drop**, superseded by `Disclosure` + `DisclosureGroup`.
- **AnchorNav family** — still relevant: it's a scrollspy/table-of-contents pattern (highlight nav link for the section in view), nothing else in the catalog covers it. **Keep.**
- **AnchorScrollTo** — **Rename to `ScrollTo`.**
- **Cursor** — **Keep, redesign for a more generic/customizable API.**
- **Frame family** (Frame, FrameAnchor, FrameForm, FrameLoader, FrameTarget, FrameTriggerLoader) — **Drop**, superseded by `Fetch`.
- **LargeText** — **Keep, redesign for more generic usage.**
- **LazyInclude** — checked against `Fetch` + `Action` + `InViewOnce`: composable in theory, but `Fetch`'s DOM update is `[id]`-selector matching (built for partial-page nav), not raw-HTML injection, so the fetched fragment would need an extra `id` wrapper to satisfy it. `LazyInclude` is ~80 lines and does `innerHTML = content` directly. **Keep** as the lightweight primitive, **renamed to `Defer`**. Naming survey against comparable prior art (Unpoly's `up-defer`, Remix's `defer()`/`<Await>`, htmx's "Lazy Loading" trigger pattern, Turbo's `loading="lazy"`, the community `<html-include>` element) — "defer" is the established web-platform term for "fetch and inject after initial load" (`<script defer>`, Remix `defer()`, Unpoly `up-defer`), and it avoids the collision with `InView`/`Prefetch`'s viewport-triggered "lazy" vocabulary that `LazyInclude` had. Events renamed to match: `content` → `defer-content`, `error` → `defer-error`, `always` → `defer-always` (mirrors `Fetch`'s own `fetch-*` prefixed events).
- **Modal family** (Modal, ModalWithTransition, Panel + StyledModal/StyledPanel templates) — **Drop**, replaced by `Dialog`. Confirmed.
- **ScrollAnimation family** (7 items) + **animationScrollWithEase** + **withScrollAnimationDebug** decorator — **Drop**, superseded by `ui-motion`. Confirmed.
- **Sentinel** — comment said "obsolete, superseded by InView/InViewOnce, drop." Checked the underlying js-toolkit decorators: `Sentinel` wraps `withIntersectionObserver` (exposes raw `IntersectionObserverEntry`, incl. `boundingClientRect`), while `InView`/`InViewOnce` wrap `withMountWhenInView`, which collapses every entry to a single in/out boolean and discards `boundingClientRect`. `Sticky` needs `entry.boundingClientRect.y < 0` to tell "scrolled above the viewport top" apart from "scrolled below the viewport bottom" — `InView` can't make that distinction. **Keep as-is.**
- **Sticky** — evaluated for usefulness per request: it's not a `position: sticky` wrapper, its real job is coordinating *multiple* stacked sticky elements (offset stacking, per-instance z-index) and hiding on scroll direction — CSS alone can't do either. **Keep as-is.**
- **Slider vs Carousel** — not a straight duplication. `Carousel` is newer (7 commits) and built on the shared `Indexable`/`withIndex` decorator, whose own docblock says it's meant as "a base for index-driven components such as sliders **and carousels**." `Slider` is older (38 commits) with its own bespoke continuous drag-physics engine (momentum, `fitBounds`, `contain`, `sensitivity`/`dropSensitivity` for variable-width freeform dragging) that `Carousel` doesn't have, and is flagged `@todo a11y` (incomplete). Dropping `Slider` today would lose the continuous-drag/variable-width capability. **Rewrite**: port `Slider`'s physics onto the `Indexable` foundation `Carousel` already uses — not a simple delete.

## Review decisions (round 4)

- Every component not otherwise flagged above (previously listed as "unreviewed") has been reviewed and is **confirmed kept as-is** for v2. The full inventory below is now fully reviewed: no remaining open items except the `Cursor`, `LargeText` and `CircularMarquee` generic-API redesigns, and the `Slider`/`Tabs` rewrite scope.

## Review decisions (round 3)

- **Frame family** (Frame, FrameAnchor, FrameForm, FrameLoader, FrameTarget, FrameTriggerLoader) — **deprecated in favor of `Fetch`, dropped in v2.** Confirmed.
- **ScrollAnimation family** (7 items) — **deprecated in favor of `ui-motion` components, dropped in v2.** Confirmed.
- **Modal + Panel family** (Modal, ModalWithTransition, Panel) — **deprecated in favor of `Dialog`, dropped in v2.** Confirmed.
- **PrefetchWhenOver** — **renamed to `PrefetchOnInteraction`.**
- **Slider** — **rewrite** (onto the `Indexable` foundation, per the round-2 finding above).
- **Tabs** — **rewrite.**
- **withScrollAnimationDebug** — **dropped in v2.**
- **animationScrollWithEase** — **dropped in v2.**
- **Reinsurance** (Twig) — **dropped.**
- **ImageGrid** (Twig) — **dropped.**
- **StyledModal** (Twig) — **dropped.**
- **StyledPanel** (Twig) — **dropped.**

## Review decisions (round 5)

- **withIndex** — the port folded the decorator into the concrete `Indexable` class and deleted it, which contradicted the "decorators (4)" list below, where `withIndex` is kept. **Resolution: the review wins, and the decorator is restored.** The behaviour lives in `withIndex()` at `packages/ui/src/decorators/withIndex.ts` and `Indexable` is `withIndex(Base)` plus the component name — one implementation, the same split `withTransition()`/`Transition` already uses. The class alone could not serve a component that already extends something else, which is what a mixin is for.

## Review decisions (round 6)

- **Tabs** — the rewrite the review asked for is **done**. Scope, as built: the WAI-ARIA Tabs pattern in full (`tablist`/`tab`/`tabpanel` roles, `aria-selected`, `aria-controls`/`aria-labelledby`, roving `tabindex`, arrow/`Home`/`End` keys, `aria-orientation`), a new required `list` ref carrying the `tablist` role, the `styles` option **dropped** — with it the last consumer of `config.options[…].merge`, which js-toolkit v4 removed by decision (REPORT.md gap 9) — visibility moved onto the `hidden` property and animation onto nested `Transition`/`ViewTransition` children the way `Dialog` and `Disclosure` already ask for, the `enable`/`disable` events namespaced to `tabs-enable`/`tabs-disable` with a `{ index, btn, content }` payload, and `enableItem()`/`disableItem()` replaced by `goTo()`/`goNext()`/`goPrev()`. **Not** built on `Indexable`/`withIndex`: the mixin's index setter emits its own `index` event and hands back no hook for the DOM work a tab switch needs, so a Tabs on it would have had two overlapping event surfaces and two inert options (`reverse`, `total`) for three lines of modulo arithmetic.

## @studiometa/ui — components (80)

### accordion

- Accordion `[ts+twig]` `[deprecated]` — replaced by DisclosureGroup + Disclosure
- AccordionItem `[deprecated]` — replaced by Disclosure

### action

- Action
- Target

### anchor-nav

- AnchorNav
- AnchorNavLink
- AnchorNavTarget

### anchor-scroll-to

- AnchorScrollTo — **renamed to `ScrollTo`** (AnchorNavLink extends it, follows the rename)

### carousel

- Carousel
- CarouselBtn
- CarouselDrag
- CarouselItem
- CarouselWrapper

### circular-marquee

- CircularMarquee `[ts+twig]`

### click-outside

- ClickOutside

### cursor

- Cursor `[ts+twig]`

### data

- DataBind
- DataComputed
- DataEffect
- DataModel
- DataScope

### dialog

- Dialog

### disclosure

- Disclosure `[ts+twig]`
- DisclosureGroup

### draggable

- Draggable

### fetch

- Fetch
- FetchShopifyPartial `[shopify]`
- FetchShopifySection `[shopify]`

### figure

- Figure `[ts+twig]`
- FigureShopify `[shopify]`
- FigureTwicpics `[ts+twig]` `[twicpics]`

### figure-video

- FigureVideo `[ts+twig]`
- FigureVideoTwicpics `[ts+twig]` `[twicpics]`

### frame

- Frame `[deprecated]` — replaced by Fetch
- FrameAnchor `[deprecated]` — replaced by Fetch
- FrameForm `[deprecated]` — replaced by Fetch
- FrameLoader `[deprecated]` — replaced by Fetch
- FrameTarget `[deprecated]` — replaced by Fetch
- FrameTriggerLoader `[deprecated]` — replaced by Fetch

### hoverable

- Hoverable

### indexable

- Indexable

### in-view

- InView
- InViewOnce

### large-text

- LargeText `[ts+twig]`

### defer

- Defer (renamed from `LazyInclude`; events `defer-content`, `defer-error`, `defer-always`)

### menu

- Menu
- MenuBtn
- MenuList

### modal

- Modal `[ts+twig]` `[deprecated]` — replaced by Dialog
- ModalWithTransition `[deprecated]` — replaced by Dialog
- Panel `[ts+twig]` `[deprecated]` — extends Modal

### prefetch

- PrefetchWhenOver — **renamed to `PrefetchOnInteraction`**
- PrefetchWhenVisible

### scroll-animation

- ScrollAnimation `[deprecated]` — whole family dropped, superseded by ui-motion
- ScrollAnimationChild `[deprecated]` — whole family dropped, superseded by ui-motion
- ScrollAnimationChildWithEase `[deprecated]` — whole family dropped, superseded by ui-motion
- ScrollAnimationParent `[deprecated]` — whole family dropped, superseded by ui-motion
- ScrollAnimationTarget `[deprecated]` — whole family dropped, superseded by ui-motion
- ScrollAnimationTimeline `[deprecated]` — whole family dropped, superseded by ui-motion
- ScrollAnimationWithEase `[deprecated]` — whole family dropped, superseded by ui-motion

### scroll-reveal

- ScrollReveal

### sentinel

- Sentinel

### slider

- Slider — **rewrite**, onto the `Indexable` foundation `Carousel` already uses
- SliderBtn
- SliderCount
- SliderDots
- SliderDrag
- SliderItem
- SliderProgress

### sticky

- Sticky `[ts+twig]`

### tabs

- Tabs `[ts+twig]` — **rewrite**

### timer

- Timer
- TimerProgress

### toaster

- Toast
- Toaster

### track

- Track
- TrackContext
- TrackShopify `[shopify]`

### transition

- Transition
- ViewTransition

## @studiometa/ui — abstract base classes (6)

- AbstractCarouselChild `[abstract]`
- AbstractCarouselComponent `[abstract]`
- AbstractFrameTrigger `[abstract]`
- AbstractPrefetch `[abstract]`
- AbstractScrollAnimation `[abstract]`
- AbstractSliderChild `[abstract]`

## @studiometa/ui — decorators (4)

- withDeprecation
- withIndex
- withScrollAnimationDebug `[deprecated]` — dropped, superseded by `ui-motion`
- withTransition

## @studiometa/ui — helpers (2)

- animationScrollWithEase `[deprecated]` — use CSS easing or animation options
- viewTransition

## @studiometa/ui — Twig only templates (10)

- Button `[twig]`
- StyledButton `[twig]`
- StyledButtonRounded `[twig]`
- Hero `[twig]`
- Icon `[twig]`
- IconImg `[twig]`
- IconList `[twig]`
- ImageGrid `[twig]` `[deprecated]` — dropped
- MapboxStaticMap `[twig]`
- Reinsurance `[twig]` `[deprecated]` — dropped

Styled variants shipped with the deprecated Modal group:

- StyledModal `[twig]` `[deprecated]` — dropped
- StyledPanel `[twig]` `[deprecated]` — dropped

## @studiometa/ui — SVG icon set (16)

- at, chevron, copy, facebook, globe, instagram, link, linkedin, logo-studiometa, mail, phone, pinterest, tiktok, twitter, whatsapp, x

## @studiometa/ui-mapbox — components (14)

- MapboxMap
- MapboxSource
- MapboxLayer
- MapboxMarker
- MapboxPopup
- MapboxCluster
- MapboxClusterItem
- MapboxImage
- MapboxImages
- MapboxGeocoder
- MapboxFullscreenControl
- MapboxGeolocateControl
- MapboxNavigationControl
- StoreLocator

Abstract base classes:

- AbstractMapboxControl `[abstract]`
- AbstractMapboxMapChild `[abstract]`

## @studiometa/ui-motion — components (4)

- Motion
- MotionScrollTimeline
- MotionSequence
- MotionView
