import { test, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

// Snapshot the FULL public export surface of each package barrel — values AND
// type-only exports — so converting `export *` re-exports to explicit named
// `export { ... }` cannot silently drop a name or flip a value into a
// type-only export. A runtime `Object.keys` snapshot (see `index.spec.ts`)
// only covers value exports; the type-only exports are erased at runtime, so
// they need a static, type-checker-based enumeration to be guarded.
//
// `typescript` is resolved from the workspace root — it is the compiler the
// whole repo already relies on — so it is not a direct dependency here.

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const { config } = ts.readConfigFile(resolve(ROOT, 'tsconfig.json'), ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config, ts.sys, ROOT);

const ENTRIES = {
  '@studiometa/ui': 'packages/ui/src/index.ts',
  '@studiometa/ui-mapbox': 'packages/ui-mapbox/src/index.ts',
  '@studiometa/ui-motion': 'packages/ui-motion/src/index.ts',
};

const program = ts.createProgram(
  Object.values(ENTRIES).map((rel) => resolve(ROOT, rel)),
  parsed.options,
);
const checker = program.getTypeChecker();

/**
 * Enumerate the exported members of a package barrel, tagged with whether each
 * carries a runtime value (`value`) or is type-only (`type`). Re-export aliases
 * are resolved to their target before the kind is read, so `export { foo }`
 * and `export * from '...'` are classified the same way.
 */
function surface(rel: string): string[] {
  const sourceFile = program.getSourceFile(resolve(ROOT, rel));
  if (!sourceFile) throw new Error(`Could not load ${rel}`);
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) throw new Error(`No module symbol for ${rel}`);
  return checker
    .getExportsOfModule(moduleSymbol)
    .map((symbol) => {
      const resolved =
        symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
      const kind = resolved.flags & ts.SymbolFlags.Value ? 'value' : 'type';
      return `${symbol.getName()} [${kind}]`;
    })
    .sort();
}

test('@studiometa/ui barrel export surface', () => {
  expect(surface(ENTRIES['@studiometa/ui'])).toMatchInlineSnapshot(`
    [
      "AbstractCarouselChild [value]",
      "AbstractCarouselChildProps [type]",
      "AbstractCarouselComponent [value]",
      "AbstractCarouselComponentProps [type]",
      "AbstractFrameTrigger [value]",
      "AbstractFrameTriggerProps [type]",
      "AbstractPrefetch [value]",
      "AbstractPrefetchProps [type]",
      "AbstractScrollAnimation [value]",
      "AbstractScrollAnimationProps [type]",
      "AbstractSliderChild [value]",
      "AbstractSliderChildProps [type]",
      "Accordion [value]",
      "AccordionItem [value]",
      "AccordionItemProps [type]",
      "Action [value]",
      "ActionProps [type]",
      "AnchorNav [value]",
      "AnchorNavLink [value]",
      "AnchorNavLinkProps [type]",
      "AnchorNavProps [type]",
      "AnchorNavTarget [value]",
      "AnchorScrollTo [value]",
      "AnchorScrollToProps [type]",
      "AnimationScrollWithEaseInterface [type]",
      "AnimationScrollWithEaseProps [type]",
      "Carousel [value]",
      "CarouselBtn [value]",
      "CarouselBtnProps [type]",
      "CarouselDrag [value]",
      "CarouselDragProps [type]",
      "CarouselItem [value]",
      "CarouselItemProps [type]",
      "CarouselProps [type]",
      "CarouselStore [type]",
      "CarouselWrapper [value]",
      "CarouselWrapperProps [type]",
      "CircularMarquee [value]",
      "CircularMarqueeProps [type]",
      "ClickOutside [value]",
      "ClickOutsideProps [type]",
      "Cursor [value]",
      "CursorProps [type]",
      "DataBind [value]",
      "DataBindProps [type]",
      "DataComputed [value]",
      "DataComputedProps [type]",
      "DataEffect [value]",
      "DataEffectProps [type]",
      "DataModel [value]",
      "DataModelProps [type]",
      "DataScope [value]",
      "DataScopeProps [type]",
      "DataValue [type]",
      "DeprecationInterface [type]",
      "DeprecationProps [type]",
      "Dialog [value]",
      "DialogProps [type]",
      "Disclosure [value]",
      "DisclosureGroup [value]",
      "DisclosureGroupProps [type]",
      "DisclosureProps [type]",
      "Draggable [value]",
      "DraggableProps [type]",
      "Fetch [value]",
      "FetchConstructor [type]",
      "FetchProps [type]",
      "FetchShopifyPartial [value]",
      "FetchShopifyPartialConstructor [type]",
      "FetchShopifyPartialProps [type]",
      "FetchShopifySection [value]",
      "FetchShopifySectionConstructor [type]",
      "FetchShopifySectionProps [type]",
      "Figure [value]",
      "FigureProps [type]",
      "FigureShopify [value]",
      "FigureShopifyProps [type]",
      "FigureTwicpics [value]",
      "FigureTwicpicsProps [type]",
      "FigureVideo [value]",
      "FigureVideoProps [type]",
      "FigureVideoTwicpics [value]",
      "FigureVideoTwicpicsProps [type]",
      "Frame [value]",
      "FrameAnchor [value]",
      "FrameAnchorProps [type]",
      "FrameContentAfterEvent [type]",
      "FrameContentEvent [type]",
      "FrameErrorEvent [type]",
      "FrameFetchAfterEvent [type]",
      "FrameFetchBeforeEvent [type]",
      "FrameFetchEvent [type]",
      "FrameForm [value]",
      "FrameFormProps [type]",
      "FrameLoader [value]",
      "FrameLoaderProps [type]",
      "FrameProps [type]",
      "FrameRequestInit [type]",
      "FrameTarget [value]",
      "FrameTargetProps [type]",
      "FrameTriggerEvent [type]",
      "FrameTriggerLoader [value]",
      "FrameTriggerLoaderProps [type]",
      "Hoverable [value]",
      "HoverableProps [type]",
      "InView [value]",
      "InViewOnce [value]",
      "Indexable [value]",
      "IndexableBoundary [type]",
      "IndexableInstructions [type]",
      "IndexableInterface [type]",
      "IndexableProps [type]",
      "LargeText [value]",
      "LargeTextProps [type]",
      "LazyInclude [value]",
      "LazyIncludeProps [type]",
      "Menu [value]",
      "MenuBtn [value]",
      "MenuList [value]",
      "MenuListProps [type]",
      "MenuProps [type]",
      "Modal [value]",
      "ModalProps [type]",
      "ModalWithTransition [value]",
      "Panel [value]",
      "PanelProps [type]",
      "PrefetchWhenOver [value]",
      "PrefetchWhenVisible [value]",
      "ScrollAnimation [value]",
      "ScrollAnimationChild [value]",
      "ScrollAnimationChildProps [type]",
      "ScrollAnimationChildWithEase [value]",
      "ScrollAnimationParent [value]",
      "ScrollAnimationParentProps [type]",
      "ScrollAnimationProps [type]",
      "ScrollAnimationTarget [value]",
      "ScrollAnimationTargetProps [type]",
      "ScrollAnimationTimeline [value]",
      "ScrollAnimationTimelineProps [type]",
      "ScrollAnimationWithEase [value]",
      "ScrollReveal [value]",
      "ScrollRevealProps [type]",
      "Sentinel [value]",
      "Slider [value]",
      "SliderBtn [value]",
      "SliderBtnProps [type]",
      "SliderCount [value]",
      "SliderCountProps [type]",
      "SliderDots [value]",
      "SliderDotsProps [type]",
      "SliderDrag [value]",
      "SliderDragProps [type]",
      "SliderItem [value]",
      "SliderItemProps [type]",
      "SliderModes [type]",
      "SliderProgress [value]",
      "SliderProgressProps [type]",
      "SliderProps [type]",
      "SliderStore [type]",
      "Sticky [value]",
      "StickyProps [type]",
      "Tabs [value]",
      "TabsProps [type]",
      "Target [value]",
      "TargetProps [type]",
      "Timer [value]",
      "TimerProgress [value]",
      "TimerProps [type]",
      "Toast [value]",
      "ToastProps [type]",
      "Toaster [value]",
      "ToasterProps [type]",
      "ToasterShowOptions [type]",
      "Track [value]",
      "TrackContext [value]",
      "TrackContextProps [type]",
      "TrackProps [type]",
      "TrackShopify [value]",
      "TrackShopifyProps [type]",
      "Transition [value]",
      "TransitionConstructor [type]",
      "TransitionInterface [type]",
      "TransitionProps [type]",
      "ViewTransition [value]",
      "ViewTransitionProps [type]",
      "WithScrollAnimationDebugInterface [type]",
      "WithScrollAnimationDebugProps [type]",
      "animationScrollWithEase [value]",
      "viewTransition [value]",
      "withDeprecation [value]",
      "withIndex [value]",
      "withScrollAnimationDebug [value]",
      "withTransition [value]",
    ]
  `);
});

test('@studiometa/ui-mapbox barrel export surface', () => {
  expect(surface(ENTRIES['@studiometa/ui-mapbox'])).toMatchInlineSnapshot(`
    [
      "AbstractMapboxControl [value]",
      "AbstractMapboxControlProps [type]",
      "AbstractMapboxMapChild [value]",
      "AbstractMapboxMapChildProps [type]",
      "MAPBOX_CLUSTER_CONNECTED [value]",
      "MAPBOX_MAP_CONNECTED [value]",
      "MapboxCluster [value]",
      "MapboxClusterItem [value]",
      "MapboxClusterItemProps [type]",
      "MapboxClusterProps [type]",
      "MapboxFullscreenControl [value]",
      "MapboxFullscreenControlProps [type]",
      "MapboxGeocoder [value]",
      "MapboxGeocoderConstructor [type]",
      "MapboxGeocoderControl [type]",
      "MapboxGeocoderProps [type]",
      "MapboxGeolocateControl [value]",
      "MapboxGeolocateControlProps [type]",
      "MapboxGl [type]",
      "MapboxImage [value]",
      "MapboxImageProps [type]",
      "MapboxImages [value]",
      "MapboxImagesProps [type]",
      "MapboxLayer [value]",
      "MapboxLayerProps [type]",
      "MapboxMap [value]",
      "MapboxMapProps [type]",
      "MapboxMarker [value]",
      "MapboxMarkerProps [type]",
      "MapboxNavigationControl [value]",
      "MapboxNavigationControlProps [type]",
      "MapboxPopup [value]",
      "MapboxPopupProps [type]",
      "MapboxSource [value]",
      "MapboxSourceProps [type]",
      "StoreLocator [value]",
      "StoreLocatorProps [type]",
      "provideMapboxGeocoder [value]",
      "provideMapboxGl [value]",
      "resolveMapboxGeocoder [value]",
      "resolveMapboxGl [value]",
    ]
  `);
});

test('@studiometa/ui-motion barrel export surface', () => {
  expect(surface(ENTRIES['@studiometa/ui-motion'])).toMatchInlineSnapshot(`
    [
      "Motion [value]",
      "MotionModule [type]",
      "MotionProps [type]",
      "MotionScrollTimeline [value]",
      "MotionScrollTimelineProps [type]",
      "MotionSequence [value]",
      "MotionSequenceProps [type]",
      "MotionView [value]",
      "MotionViewProps [type]",
      "provideMotion [value]",
      "resolveMotion [value]",
    ]
  `);
});
