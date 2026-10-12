### Added

- **@studiometa/ui-mapbox:** let `MapboxGeocoder` work without a parent `MapboxMap`, with its own `accessToken` option ([#665](https://github.com/studiometa/ui/pull/665))
- **Action:** add the reserved `mounted` pseudo-event ([#658](https://github.com/studiometa/ui/pull/658))
- **Sheet:** add a swipeable `Dialog` child driven by native scroll snapping and a CSS view timeline, in preview ([#670](https://github.com/studiometa/ui/pull/670))
- **Track:** add `$event.<path>` placeholders in every payload source, with `$detail.<path>` as a shortcut ([#658](https://github.com/studiometa/ui/pull/658))

### Changed

- ⚠️ **Track:** rename `resolveDetailPlaceholders` to `resolveEventPlaceholders`, which takes the event instead of its detail ([#658](https://github.com/studiometa/ui/pull/658))
- **@studiometa/ui-mapbox:** mount `MapboxMap`, `StoreLocator` and `MapboxGeocoder` when they near the viewport, also when registered directly ([#655](https://github.com/studiometa/ui/pull/655))
- **Track:** read the inherited context and both payload sources at dispatch time instead of caching them per mount cycle ([#658](https://github.com/studiometa/ui/pull/658))
- **Track:** resolve placeholders with the `.detail` modifier, and merge the detail last ([#658](https://github.com/studiometa/ui/pull/658))
- **Action:** resolve targets when a debounced effect runs, not when the event fires ([#658](https://github.com/studiometa/ui/pull/658))

### Fixed

- **@studiometa/ui-mapbox:** autoload map children declared on a `hidden` element ([#655](https://github.com/studiometa/ui/pull/655))
- **@studiometa/ui-motion:** mount every motion component as soon as its element is on the page ([#667](https://github.com/studiometa/ui/pull/667))
- **Track:** wait for the DOM to settle before a `data-track:mounted` dispatch, so a `TrackContext` loaded lazily is included ([#658](https://github.com/studiometa/ui/pull/658))
