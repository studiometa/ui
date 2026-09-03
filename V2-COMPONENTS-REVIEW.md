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

- **The drag settle is animated by the component, not by `behavior: 'smooth'`.** Measured on the docs examples: at a release from a steady 60 px/frame drag, the browser's smooth scroll moved 0 px on the first frame, 1.9 on the second and 10 on the third, taking five frames to reach the speed the hand already had — it eases _in_ from a standstill. The settle now decays at the drag service's own rate (`1 - DEFAULT_DAMP_FACTOR` per 60 Hz frame), which is the model the service used to project the throw in the first place, so the track leaves the pointer at 76% of its velocity and slows monotonically from there. Two consequences: the `scrollend`-racing-a-1000 ms-timeout restore is gone, because the component now knows exactly when its own animation ends; and the settle position is carried in a field rather than read back from `scrollLeft`, because a scroller rounds that value and the last sub-pixel frames of a decay would otherwise stall a few pixels short of the target for ever.

Three round-7 claims did not survive contact with the built component.

- **The alignment is the slide's CSS, and always was meant to be.** Round 7 treated `Slider`'s `mode: left|center|right` as equivalent to scroll alignment; it was not, because `Carousel` hardcoded `align: center`. **Resolved, and not with an option.** `Carousel.positions` reads each slide's own `scroll-snap-align` and scrolls to the offset that alignment names, so `goTo()` lands exactly where a native snap would. `mode="left"` is `scroll-snap-align: start`, `mode="right"` is `end`. Reading the CSS is what makes the programmatic target and the native one a single decision instead of two that can disagree — hardcoding `center` meant they only agreed where a slide filled the track. It is read per slide, because the property is declared per slide. No option was added: an `align` option would have been a second place to say the same thing.
- **The one-slide flick clamp is removed.** Round 7 called an unclamped flick a defect: "`__snap` has no one-snap clamp, so a hard flick crosses many slides". Crossing many slides is the inertia, and it is what v1 had. A clamp turns a throw into a step and takes the momentum out of the component, so it is gone, and with it the flick threshold and the `skipSnaps` option that existed only to opt out of it. Every release is ballistic now: the snap nearest the projected resting point. What the rewrite keeps is the **measurement** — v1 multiplied the last event's delta by a magic `-2.5`, a per-device quantity, so the same flick threw differently on a 1000 Hz mouse and a 125 Hz trackpad; the drag service reports its own settle position, so the gesture means the same thing on every device.
- **`fitBounds: false` is restored, as CSS.** Round 7 said the freeform settle "is a CSS option, not a reason to keep a transform engine", which was right about the scroll and wrong about the drop: `CarouselDrag.__snap()` scrolled to the nearest slide regardless of what the track declared. It now reads the track's `scroll-snap-type` and, on `none`, coasts to the projected position and stops between slides. So `fitBounds` is not carried over as an option either — like the alignment, the track already says it, and a component that snapped a drop on a track the browser does not snap would be contradicting the CSS.

Reading the track's own value turned up a defect of its own: `__restoreSnapping()` put snapping back by clearing the inline `scroll-snap-type`. That is right only for a track styled from a stylesheet — on one styled inline, it deleted the author's declaration, so the first drag turned snapping off for the life of the page. The component now captures what it found at the start of a gesture and puts exactly that back, and only when it was the one that took it. The existing specs asserted the cleared value and called it "restored"; they assert the author's value now.

## Review decisions (round 9)

**The `Cursor` generic-API redesign round 2 asked for is built.** Eight options become two, and the component publishes what it knows instead of drawing one hardcoded visual.

- **`damping` and `states` are the whole option surface.** `growSelectors`, `shrinkSelectors`, `scale`, `growTo`, `shrinkTo`, `translateDampFactor`, `growDampFactor` and `shrinkDampFactor` are gone. `states` is an `Object` option mapping selector to author-named state, so a cursor has as many states as its author writes rather than the two v1 fixed. Every removed option was a CSS declaration in disguise: `[data-cursor-state='grow'] { scale: 2 }` says what `growTo: 2` said, in the author's own easing, on a compositable property, and for a ring that changes colour or an image that rotates as readily as for a dot that scales.
- **Published surface**: `--cursor-x` and `--cursor-y` (the damped position, in px), `data-cursor-state`, `data-cursor-down`. Same convention as `Carousel`'s `--carousel-progress` / `--carousel-item-active` / `aria-current`.
- **Selectors are matched with `closest()`, not `matches()`.** The target of a pointer event is the deepest element under it, which is the only reason v1's defaults had to spell `a, a *, button, button *`. One consequence to document: entries are tried in declaration order and the first match wins, so order is the precedence, not depth in the tree.
- **Pointer-down is published apart from the state, as `data-cursor-down`.** The alternative — a reserved `down` state name — was rejected: v1 forced the shrink scale while the button was down, so a press over a growing element silently lost its grow and no author could change that precedence. Where the pointer is and whether the button is down are two independent facts, so they get two hooks and the cascade arbitrates (`[data-cursor-state='grow'][data-cursor-down]`). It also reserves no name, so a map is free to call one of its states `down`.
- **The unmatched state is the empty string, not a removed attribute.** `data-cursor-state` is always present. A channel that disappears is one a stylesheet has to test for existence before it can style around it, and it makes `[data-cursor-state]` silently select the resting cursor too. `CarouselItem` already writes `--carousel-item-active: 0` rather than removing the property; this is the same choice.
- **The component still writes the transform.** Per the measurement — 300 frames, forced layout each, both run orders — a custom-property write is neither faster nor slower than a transform write beyond the run-to-run noise. So publishing alone would buy nothing and cost the out-of-the-box default, and the component keeps writing the position itself.
- **It writes it into `translate`, not `transform`.** The individual transform properties compose in the fixed order `translate`, `rotate`, `scale`, `transform`, with `translate` outermost. A position written into `transform` sits _inside_ a `scale` from a stylesheet, so a cursor at `scale: 2` would chase the pointer at twice its speed. Verified in the browser: at `scale: 2` over a link, the 96 px dot's centre sits exactly on the pointer. `rotate`, `scale` and `transform` are all left to the author. One cost: `translate` whose z is `0` serialises back to the 2D form, so v1's `translateZ(0)` cannot be spelled here — the compositor hint is `will-change: translate`, which the template ships and an author can drop.
- **`Cursor.twig` ships the default stylesheet**, wrapped in `:where()` so it has zero specificity and any author rule wins without `!important` and without an opt-out flag. Its Tailwind classes are gone, so the template no longer assumes Tailwind. New `states` and `damping` parameters.
- **A `cursor.invalid-selector` diagnostic is added.** One malformed selector in a JSON attribute would otherwise throw on every pointer move and take the whole cursor down; it now reports once per selector and the other entries keep working.
- **The spec is rewritten**, 12 tests to 21: the published properties, the damping, the `states` resolution and its clearing, the ancestor match, declaration-order precedence, the press behaviour, the diagnostic, and a browser assertion that a stylesheet `scale` does not move the cursor off the pointer — **+9 on the tree**.

## Review decisions (round 10)

**`LargeText` and `CircularMarquee` are one component, `Marquee`.** The generic redesign round 2 and round 4 left open for both is done, and it is one redesign because they were one component: both accumulated the scroll delta, damped it at a hardcoded `0.25` and wrote a transform. Only the transform property differed. "Circular" was the SVG `textPath` in `CircularMarquee.twig` and nothing else — zero JavaScript. And `LargeText` never made text large; it was a scroll-driven marquee that had inherited a name from a component which once scaled text to fill a width.

- **The component publishes, CSS paints.** `Marquee` writes `--marquee-progress` (0→1, wrapping), `--marquee-offset` (the same travel unwrapped and signed) and `--marquee-velocity` (the damped rate, in loops per second) on its own element, and nothing else — the convention `Carousel` set with `--carousel-progress`. A horizontal marquee is `translateX(calc(var(--marquee-progress) * -100%))`, a circular one is `rotate(…360deg)`, a skew reads `--marquee-velocity`. One class covers both, and any third reading of the same number.
- **The loop no longer measures anything.** With a normalised progress, `-100%` **is** the content width by definition. Gone with the measurement: `clientWidth`, `resized()`, the `withResize` mixin, the `target` ref and the `width` property. `LargeText` re-measured on every resize to know where its loop ended; there is no end to know.
- **Three options, in units that say what they mean.** `speed` is the idle travel in loops per second, `sensitivity` the scroll boost in loops per pixel scrolled (negative reverses, as v1's did), `damping` the smoothing that both components hardcoded at `0.25`. v1 hid the idle speed inside the magic `+ 1` of `(Math.abs(deltaY) + 1) * sensitivity`, so one number set the idle speed and the scroll boost at once, and the frame rate set the real value of both.
- **Reduced motion is honoured, and the line is drawn at who moves it.** Under `prefers-reduced-motion: reduce` the idle `speed` stops and the scroll-driven travel continues: continuous idle motion is decorative motion nobody asked for, which is what WCAG 2.2 SC 2.2.2 is about, while travel tied to the scroll is the user's own gesture and stops when they stop. The query is read through `usePrefersReducedMotion()` and stays subscribed, so turning the setting on mid-session stops a marquee that is already mounted. Neither v1 component honoured it at all.
- **Two v1 defects fall out of the rewrite.** The scroll delta was latched, never consumed, so a marquee ran on for ever at the speed of a scroll that had finished; each frame now consumes the distance actually scrolled since the previous one. And `CircularMarquee` had no test of any kind — the specs read the element's published values rather than the instance's fields, so an inert component writes nothing and fails.
- **`CircularMarquee.twig` is kept**, moved under `Marquee/`, as a Twig-only helper: its radius/perimeter geometry is genuinely useful and needs no JavaScript of its own. It renders `data-component="Marquee"` plus the rotation. `Marquee.twig` keeps `LargeText.twig`'s repeat-the-content mechanism, which is what makes the loop seamless, and drops the `position_factor` it computed from the sign of the sensitivity: a wrapped progress only ever travels from 0 to -100%, whichever way it is going, so the copies always sit to the right.
- **One deviation from the brief, recorded.** `--marquee-offset` counts loops, not pixels. A pixel figure would need the element measured, which is the read the redesign exists to remove.

`Marquee` adds 13 specs and the deleted `LargeText` spec takes 6 away, **+7 on the tree**.

Rounds 9 and 10 landed together: the tree holds **956 tests across 86 files**, from a baseline of 940.

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

- CircularMarquee `[ts+twig]` — **merged into `Marquee`** per round 9. The class is removed; `CircularMarquee.twig` survives at `@ui/Marquee/CircularMarquee.twig` as a Twig-only helper.

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

### marquee

- LargeText `[ts+twig]` — **renamed to `Marquee`** per round 9, absorbing `CircularMarquee`, with a published-custom-property API in place of the transform it used to write.

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
