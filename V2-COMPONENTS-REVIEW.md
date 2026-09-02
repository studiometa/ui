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
- **Sticky** — evaluated for usefulness per request: it's not a `position: sticky` wrapper, its real job is coordinating _multiple_ stacked sticky elements (offset stacking, per-instance z-index) and hiding on scroll direction — CSS alone can't do either. **Keep as-is.**
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

## Review decisions (round 7)

**The `Slider` rewrite is redefined, and round 2's scope for it is withdrawn.** Round 2 concluded "port `Slider`'s physics onto the `Indexable` foundation `Carousel` already uses". A source audit of both families, a benchmark of twelve libraries plus the native platform, cross-engine keyboard tests and the interaction research together say the foundation is not the problem — **the transport is**.

- **One family, on native scroll + `scroll-snap`.** `Slider`'s seven classes are removed; the native-scroll family absorbs the four controls it lacks. The audit found exactly one _essential_ difference between the two families — where a release comes to rest — and that dissolves: `scroll-snap-type: none` gives the freeform settle natively, so `fitBounds: false` is a CSS option, not a reason to keep a transform engine. Round 2's premise that dropping `Slider` "would lose the continuous-drag/variable-width capability" does not hold: `Carousel.positions()` already measures per element and handles variable widths identically.
- **Round 2 also over-credited `Slider`'s physics.** The momentum is js-toolkit's shared drag service, `contain` is geometry rather than physics, and the projection is `inertiaFinalValue`. `Slider`'s own contribution is about eleven lines, and `dropSensitivity` is a magic multiplier over a value the service already computes per device — the same class of per-device bug `CarouselDrag`'s docblock records v3 having.
- **Loop is dropped**, with a diagnostic. Native scroll cannot loop, and `boundary: loop|bounce` currently wraps the index while the scroller clamps — a silent bug today.
- **Autoplay ships as a component, off by default**, composed from the existing `Timer`/`TimerProgress` primitives (`timer-end` → `goNext()`, and `timer-progress` is the progress ring already built). The component adds only what `Timer` must not know: rotation control first in the tab order, flipping label, pause on hover and focus-in without auto-resume, suppression under reduced motion.
- **A thumbnail control is added.** The one measured winner in the interaction research (55% of visitors, more than arrows and swipe combined) and the fix for the finding that 50% of desktop users could not find additional product images without one.
- **Mouse drag stays first-class, always paired with arrows.** WCAG 2.2 SC 2.5.7 requires a single-pointer alternative to any author-implemented dragging movement; native scrollbar drag is exempt, ours is not. So shipping drag _increases_ the obligation to ship arrows.
- **Arrow buttons are the keyboard contract, not native scrolling.** Measured in Chromium 151 and Firefox 153: one `ArrowRight` on a snap track scrolls ~40px and snaps straight back, and `Home`/`End`/`PageUp`/`PageDown` do nothing on the horizontal axis. `aria-hidden` leaves slides fully tabbable; `inert` removes them; the track is natively focusable only when it has no focusable children — which a real carousel always has.
- **Not adopted:** the Chromium-only CSS carousel primitives (`::scroll-marker`, `::scroll-button()`), and `tablist`/`tab` semantics on dots.

Two defects in `CarouselDrag` are load-bearing for this and must be fixed with it: `__snap` has no one-snap clamp, so a hard flick crosses many slides; and it restores `scrollSnapType` on a `scrollend` that never fires when the position did not change, leaving snapping permanently off.

The full proposal, with the evidence and the measurements behind each decision, is at <https://claude.ai/code/artifact/9648743e-7bb4-4962-8e33-ebcb91ee70f7>.

## Review decisions (round 8)

**Round 7 is built.** The four missing controls are added and the seven `Slider` classes are removed. The tree holds 927 tests across 86 files — the baseline 907, plus 49 for the new controls, minus the 29 in the four deleted `Slider` specs.

- **Four controls added**, each on its own element, each optional, none importing `Carousel`: `CarouselDots`, `CarouselThumbnails`, `CarouselCount`, `CarouselProgress`. The pickers read a live `$watchChildren` collection, so a slide added after mount needs no `$update()`. `CarouselProgress` reads a new `progress` signal on the shared context. A new `hasAccessibleName()` helper in `Carousel/utils.ts` backs the `carousel.unnamed` diagnostic, and reads the computed accessible name rather than `textContent`, so an icon-only control with `aria-label` passes.
- **`CarouselPlay` is registered by `Carousel`.** Round 7 planned it as a separate registration, "since a carousel that does not rotate should not pay for it". That reasoning was wrong: `config.components` entries are resolved per element, so a carousel with no play button never constructs one. Registration is now uniform across all eight children, and the docs that claimed otherwise are corrected.
- **One of the two `CarouselDrag` defects round 7 flagged was real.** `__restoreSnappingAfterSettle()` now races `scrollend` against a 1000 ms timeout, so snapping comes back even when the position never changed and no `scrollend` fires. The other was not a defect — see below.
- **The index no longer walks the slides during a `goTo()`.** `CarouselWrapper.onScroll` reported the closest item on every scroll frame, including the frames of the smooth scroll `goTo()` had just started — so clicking a dot three slides away sent the index `3 → 0 → 2 → 3`, and every control that marks the current item flickered off and back on. Reporting is now held for the duration of a programmatic scroll, released on `scrollend` racing the same 1000 ms timeout, and released early by a `pointerdown` or `wheel` on the track, which is a user taking the scroll back. `progress` stays live throughout, because a progress bar frozen for the length of the animation would be the worse artefact. The wrapper's docblock had argued no guard was needed; it was reasoning about a feedback loop, which indeed cannot form, and not about what gets reported on the way.

Three round-7 claims did not survive contact with the built component.

- **The alignment is the slide's CSS, and always was meant to be.** Round 7 treated `Slider`'s `mode: left|center|right` as equivalent to scroll alignment; it was not, because `Carousel` hardcoded `align: center`. **Resolved, and not with an option.** `Carousel.positions` reads each slide's own `scroll-snap-align` and scrolls to the offset that alignment names, so `goTo()` lands exactly where a native snap would. `mode="left"` is `scroll-snap-align: start`, `mode="right"` is `end`. Reading the CSS is what makes the programmatic target and the native one a single decision instead of two that can disagree — hardcoding `center` meant they only agreed where a slide filled the track. It is read per slide, because the property is declared per slide. No option was added: an `align` option would have been a second place to say the same thing.
- **The one-slide flick clamp is removed.** Round 7 called an unclamped flick a defect: "`__snap` has no one-snap clamp, so a hard flick crosses many slides". Crossing many slides is the inertia, and it is what v1 had. A clamp turns a throw into a step and takes the momentum out of the component, so it is gone, and with it the flick threshold and the `skipSnaps` option that existed only to opt out of it. Every release is ballistic now: the snap nearest the projected resting point. What the rewrite keeps is the **measurement** — v1 multiplied the last event's delta by a magic `-2.5`, a per-device quantity, so the same flick threw differently on a 1000 Hz mouse and a 125 Hz trackpad; the drag service reports its own settle position, so the gesture means the same thing on every device.
- **`fitBounds: false` is only half restored.** Round 7 said the freeform settle "is a CSS option, not a reason to keep a transform engine". `scroll-snap-type: none` does give a freeform scroll, but `CarouselDrag.__snap()` scrolls to the nearest slide on every drop regardless. A freeform mouse release means dropping `CarouselDrag` and living with the native scrollbar. **Still open:** either `__snap()` learns to respect a non-snapping track, or the option is documented as touch-only.

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
- CarouselCount — **new in v2**, replaces `SliderCount`
- CarouselDots — **new in v2**, replaces `SliderDots`
- CarouselPlay — **new in v2**, autoplay on the `TimerProgress` primitive
- CarouselProgress — **new in v2**, replaces `SliderProgress`
- CarouselThumbnails — **new in v2**, no v1 equivalent

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

All seven are **dropped**, superseded by the `Carousel` family, per round 7. Round 3's "rewrite" and round 2's "port the physics onto `Indexable`" are both withdrawn.

- Slider — **dropped**, replaced by `Carousel`
- SliderBtn — **dropped**, replaced by `CarouselBtn`
- SliderCount — **dropped**, replaced by `CarouselCount`
- SliderDots — **dropped**, replaced by `CarouselDots`
- SliderDrag — **dropped**, replaced by `CarouselDrag`
- SliderItem — **dropped**, replaced by `CarouselItem`
- SliderProgress — **dropped**, replaced by `CarouselProgress`

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
