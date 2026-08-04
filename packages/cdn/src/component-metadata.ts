export type ComponentPackageName = '@studiometa/ui' | '@studiometa/ui-mapbox';

export type ComponentLoadStrategy = 'eager' | 'visible' | 'idle' | 'interaction';

export interface CuratedComponentMetadata {
  token: string;
  group: string;
  children?: readonly string[];
  styles?: readonly string[];
  integrations?: readonly string[];
  subpath?: string;
  exportName?: string;
}

export interface ComponentCatalog {
  packageName: ComponentPackageName;
  strategy: ComponentLoadStrategy;
  components: readonly CuratedComponentMetadata[];
  abstractExports: readonly string[];
}

const uiComponents: readonly CuratedComponentMetadata[] = [
  { token: 'Accordion', group: 'accordion', children: ['AccordionItem'] },
  { token: 'AccordionItem', group: 'accordion' },
  { token: 'Action', group: 'action' },
  { token: 'Target', group: 'action' },
  {
    token: 'AnchorNav',
    group: 'anchor-nav',
    children: ['AnchorNavLink', 'AnchorNavTarget'],
  },
  { token: 'AnchorNavLink', group: 'anchor-nav' },
  { token: 'AnchorNavTarget', group: 'anchor-nav' },
  { token: 'AnchorScrollTo', group: 'anchor-scroll-to' },
  {
    token: 'Carousel',
    group: 'carousel',
    children: ['CarouselBtn', 'CarouselDrag', 'CarouselItem', 'CarouselWrapper'],
  },
  { token: 'CarouselBtn', group: 'carousel' },
  { token: 'CarouselDrag', group: 'carousel' },
  { token: 'CarouselItem', group: 'carousel' },
  { token: 'CarouselWrapper', group: 'carousel' },
  { token: 'CircularMarquee', group: 'circular-marquee' },
  { token: 'ClickOutside', group: 'click-outside' },
  { token: 'Cursor', group: 'cursor' },
  { token: 'DataBind', group: 'data' },
  { token: 'DataComputed', group: 'data' },
  { token: 'DataEffect', group: 'data' },
  { token: 'DataModel', group: 'data' },
  { token: 'DataScope', group: 'data' },
  { token: 'Dialog', group: 'dialog', children: ['Transition', 'ViewTransition'] },
  { token: 'Disclosure', group: 'disclosure', children: ['Transition', 'ViewTransition'] },
  { token: 'DisclosureGroup', group: 'disclosure' },
  { token: 'Draggable', group: 'draggable' },
  { token: 'Fetch', group: 'fetch' },
  { token: 'FetchShopifyPartial', group: 'fetch', integrations: ['shopify'] },
  { token: 'FetchShopifySection', group: 'fetch', integrations: ['shopify'] },
  { token: 'Figure', group: 'figure' },
  { token: 'FigureShopify', group: 'figure', integrations: ['shopify'] },
  { token: 'FigureTwicpics', group: 'figure', integrations: ['twicpics'] },
  { token: 'FigureVideo', group: 'figure-video' },
  { token: 'FigureVideoTwicpics', group: 'figure-video', integrations: ['twicpics'] },
  {
    token: 'Frame',
    group: 'frame',
    children: ['FrameAnchor', 'FrameForm', 'FrameTarget', 'FrameLoader'],
  },
  { token: 'FrameAnchor', group: 'frame', children: ['FrameTriggerLoader'] },
  { token: 'FrameForm', group: 'frame', children: ['FrameTriggerLoader'] },
  { token: 'FrameLoader', group: 'frame' },
  { token: 'FrameTarget', group: 'frame' },
  { token: 'FrameTriggerLoader', group: 'frame' },
  { token: 'Hoverable', group: 'hoverable' },
  { token: 'Indexable', group: 'indexable' },
  { token: 'InView', group: 'in-view' },
  { token: 'InViewOnce', group: 'in-view' },
  { token: 'LargeText', group: 'large-text' },
  { token: 'LazyInclude', group: 'lazy-include' },
  { token: 'Menu', group: 'menu', children: ['MenuBtn', 'MenuList'] },
  { token: 'MenuBtn', group: 'menu' },
  { token: 'MenuList', group: 'menu', children: ['MenuList'] },
  { token: 'Modal', group: 'modal' },
  { token: 'ModalWithTransition', group: 'modal' },
  { token: 'Panel', group: 'modal' },
  { token: 'PrefetchWhenOver', group: 'prefetch' },
  { token: 'PrefetchWhenVisible', group: 'prefetch' },
  { token: 'ScrollAnimation', group: 'scroll-animation' },
  { token: 'ScrollAnimationChild', group: 'scroll-animation' },
  { token: 'ScrollAnimationChildWithEase', group: 'scroll-animation' },
  {
    token: 'ScrollAnimationParent',
    group: 'scroll-animation',
    children: ['ScrollAnimationChild'],
  },
  { token: 'ScrollAnimationTarget', group: 'scroll-animation' },
  {
    token: 'ScrollAnimationTimeline',
    group: 'scroll-animation',
    children: ['ScrollAnimationTarget'],
  },
  { token: 'ScrollAnimationWithEase', group: 'scroll-animation' },
  { token: 'ScrollReveal', group: 'scroll-reveal' },
  { token: 'Sentinel', group: 'sentinel' },
  { token: 'Slider', group: 'slider', children: ['SliderItem', 'SliderDrag'] },
  { token: 'SliderBtn', group: 'slider' },
  { token: 'SliderCount', group: 'slider' },
  { token: 'SliderDots', group: 'slider' },
  { token: 'SliderDrag', group: 'slider' },
  { token: 'SliderItem', group: 'slider' },
  { token: 'SliderProgress', group: 'slider' },
  { token: 'Sticky', group: 'sticky', children: ['Sentinel'] },
  { token: 'Tabs', group: 'tabs' },
  { token: 'Timer', group: 'timer' },
  { token: 'TimerProgress', group: 'timer' },
  { token: 'Toast', group: 'toaster' },
  { token: 'Toaster', group: 'toaster', children: ['Toast'] },
  { token: 'Track', group: 'track' },
  { token: 'TrackContext', group: 'track' },
  { token: 'TrackShopify', group: 'track', integrations: ['shopify'] },
  { token: 'Transition', group: 'transition' },
  { token: 'ViewTransition', group: 'transition' },
];

// Mapbox GL and the optional geocoder are external (import-map resolved) and no longer served by
// the CDN, so these components declare neither a CDN-served stylesheet nor a bundled integration
// chunk — consumers load the Mapbox JavaScript and CSS from the source their import map points at.
const mapboxComponents: readonly CuratedComponentMetadata[] = [
  { token: 'MapboxCluster', group: 'mapbox' },
  { token: 'MapboxClusterItem', group: 'mapbox' },
  { token: 'MapboxFullscreenControl', group: 'mapbox' },
  { token: 'MapboxGeocoder', group: 'mapbox' },
  { token: 'MapboxGeolocateControl', group: 'mapbox' },
  { token: 'MapboxImage', group: 'mapbox' },
  { token: 'MapboxImages', group: 'mapbox' },
  { token: 'MapboxLayer', group: 'mapbox' },
  { token: 'MapboxMap', group: 'mapbox' },
  { token: 'MapboxMarker', group: 'mapbox' },
  { token: 'MapboxNavigationControl', group: 'mapbox' },
  { token: 'MapboxPopup', group: 'mapbox' },
  { token: 'MapboxSource', group: 'mapbox' },
  { token: 'StoreLocator', group: 'mapbox' },
];

export const componentCatalogs: readonly ComponentCatalog[] = [
  {
    packageName: '@studiometa/ui',
    strategy: 'eager',
    components: uiComponents,
    abstractExports: [
      'AbstractCarouselChild',
      'AbstractCarouselComponent',
      'AbstractFrameTrigger',
      'AbstractPrefetch',
      'AbstractScrollAnimation',
      'AbstractSliderChild',
    ],
  },
  {
    packageName: '@studiometa/ui-mapbox',
    strategy: 'visible',
    components: mapboxComponents,
    abstractExports: ['AbstractMapboxControl', 'AbstractMapboxMapChild'],
  },
];
