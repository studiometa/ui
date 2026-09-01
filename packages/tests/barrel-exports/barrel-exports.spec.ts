import { test, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import ts from "typescript";

// Snapshot the FULL public export surface of each package barrel — values AND
// type-only exports — so converting `export *` re-exports to explicit named
// `export { ... }` cannot silently drop a name or flip a value into a
// type-only export. A runtime `Object.keys` snapshot (see `index.spec.ts`)
// only covers value exports; the type-only exports are erased at runtime, so
// they need a static, type-checker-based enumeration to be guarded.
//
// `typescript` is resolved from the workspace root — it is the compiler the
// whole repo already relies on — so it is not a direct dependency here.

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const { config } = ts.readConfigFile(resolve(ROOT, "tsconfig.json"), ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config, ts.sys, ROOT);

const ENTRIES = {
  "@studiometa/ui": "packages/ui/src/index.ts",
  "@studiometa/ui-mapbox": "packages/ui-mapbox/src/index.ts",
  "@studiometa/ui-motion": "packages/ui-motion/src/index.ts",
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
      const kind = resolved.flags & ts.SymbolFlags.Value ? "value" : "type";
      return `${symbol.getName()} [${kind}]`;
    })
    .sort();
}

test("@studiometa/ui barrel export surface", () => {
  expect(surface(ENTRIES["@studiometa/ui"])).toMatchInlineSnapshot(`
    [
      "AbstractCarouselChild [value]",
      "AbstractCarouselComponent [value]",
      "AbstractFigure [value]",
      "AbstractFigureDynamic [value]",
      "AbstractFigureDynamicProps [type]",
      "AbstractFigureProps [type]",
      "AbstractPrefetch [value]",
      "AbstractPrefetchProps [type]",
      "AbstractTrack [value]",
      "AbstractTrackProps [type]",
      "Action [value]",
      "ActionEvent [value]",
      "ActionProps [type]",
      "ActionTarget [type]",
      "AnchorNav [value]",
      "AnchorNavLink [value]",
      "AnchorNavLinkProps [type]",
      "AnchorNavProps [type]",
      "AnchorNavTarget [value]",
      "Carousel [value]",
      "CarouselApi [type]",
      "CarouselBtn [value]",
      "CarouselBtnProps [type]",
      "CarouselContext [value]",
      "CarouselDrag [value]",
      "CarouselItem [value]",
      "CarouselProps [type]",
      "CarouselScrollPosition [type]",
      "CarouselState [type]",
      "CarouselWrapper [value]",
      "CircularMarquee [value]",
      "CircularMarqueeProps [type]",
      "ClickOutside [value]",
      "Cursor [value]",
      "CursorProps [type]",
      "DataBind [value]",
      "DataBindOptions [type]",
      "DataBindProps [type]",
      "DataComputed [value]",
      "DataComputedProps [type]",
      "DataControlContext [type]",
      "DataControlMember [type]",
      "DataEffect [value]",
      "DataEffectProps [type]",
      "DataExpression [type]",
      "DataModel [value]",
      "DataModelProps [type]",
      "DataRegistry [value]",
      "DataRegistryContext [value]",
      "DataRegistryOptions [type]",
      "DataScope [value]",
      "DataScopeMember [type]",
      "DataScopeProps [type]",
      "DataUpdate [type]",
      "DataValue [type]",
      "Defer [value]",
      "DeferProps [type]",
      "DeprecationInterface [type]",
      "DeprecationProps [type]",
      "Dialog [value]",
      "DialogProps [type]",
      "Disclosure [value]",
      "DisclosureGroup [value]",
      "DisclosureGroupProps [type]",
      "DisclosureProps [type]",
      "Draggable [value]",
      "DraggablePosition [type]",
      "DraggableProps [type]",
      "EFFECT_ARGUMENTS [value]",
      "EffectFunction [type]",
      "FETCH_EVENTS [value]",
      "Fetch [value]",
      "FetchEmits [type]",
      "FetchEventBase [type]",
      "FetchProps [type]",
      "FetchShopifyPartial [value]",
      "FetchShopifyPartialProps [type]",
      "FetchShopifySection [value]",
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
      "HEADER_NAMES [value]",
      "Hoverable [value]",
      "HoverableBounds [type]",
      "HoverableProps [type]",
      "INDEXABLE_BOUNDARIES [value]",
      "INDEXABLE_INSTRUCTIONS [value]",
      "InView [value]",
      "InViewOnce [value]",
      "Indexable [value]",
      "IndexableBoundary [type]",
      "IndexableInstruction [type]",
      "IndexableInterface [type]",
      "IndexableProps [type]",
      "LargeText [value]",
      "LargeTextProps [type]",
      "MODIFIERS [value]",
      "Menu [value]",
      "MenuBtn [value]",
      "MenuBtnProps [type]",
      "MenuList [value]",
      "MenuListProps [type]",
      "MenuProps [type]",
      "Modifier [type]",
      "PrefetchOnInteraction [value]",
      "PrefetchWhenVisible [value]",
      "SECTIONS_PARAMETER [value]",
      "ScrollReveal [value]",
      "ScrollRevealProps [type]",
      "ScrollTo [value]",
      "ScrollToProps [type]",
      "Sentinel [value]",
      "SentinelProps [type]",
      "Slider [value]",
      "SliderApi [type]",
      "SliderBtn [value]",
      "SliderBtnProps [type]",
      "SliderContext [value]",
      "SliderCount [value]",
      "SliderCountProps [type]",
      "SliderDots [value]",
      "SliderDotsProps [type]",
      "SliderDrag [value]",
      "SliderDragProps [type]",
      "SliderItem [value]",
      "SliderItemRect [type]",
      "SliderModes [type]",
      "SliderProgress [value]",
      "SliderProgressProps [type]",
      "SliderProps [type]",
      "SliderState [type]",
      "Sticky [value]",
      "StickyProps [type]",
      "TRACK_PSEUDO_EVENTS [value]",
      "Tabs [value]",
      "TabsProps [type]",
      "Target [value]",
      "Timer [value]",
      "TimerProgress [value]",
      "TimerProgressProps [type]",
      "TimerProps [type]",
      "Toast [value]",
      "ToastProps [type]",
      "Toaster [value]",
      "ToasterProps [type]",
      "ToasterShowOptions [type]",
      "Track [value]",
      "TrackContext [value]",
      "TrackContextProps [type]",
      "TrackEvent [value]",
      "TrackProps [type]",
      "TrackPseudoEvent [type]",
      "TrackShopify [value]",
      "TrackShopifyProps [type]",
      "Transition [value]",
      "TransitionInterface [type]",
      "TransitionProps [type]",
      "Transitionable [type]",
      "ViewTransition [value]",
      "ViewTransitionProps [type]",
      "withDeprecation [value]",
      "withIndex [value]",
      "withTransition [value]",
    ]
  `);
});

test("@studiometa/ui-mapbox barrel export surface", () => {
  expect(surface(ENTRIES["@studiometa/ui-mapbox"])).toMatchInlineSnapshot(`
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

test("@studiometa/ui-motion barrel export surface", () => {
  expect(surface(ENTRIES["@studiometa/ui-motion"])).toMatchInlineSnapshot(`
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
