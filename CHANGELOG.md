# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v0.2.24]((https://github.com/studiometa/ui/compare/0.2.23..0.2.24)) (2023-01-27)

### Added

- **Slider:** add the `contain` option to SliderBtn ([#105](https://github.com/studiometa/ui/pull/105), [#101](https://github.com/studiometa/ui/issues/101))
- **Figure:** add the `placeholder_color` param ([#104](https://github.com/studiometa/ui/pull/104), [#100](https://github.com/studiometa/ui/issues/100))
- **Hero:** add hero components `hero` ([#99](https://github.com/studiometa/ui/pull/99))
- **Button:** add rounded styled button ([4c7a05d](https://github.com/studiometa/ui/commit/4c7a05d))

### Changed

- **Doc:** add a link to the playground in the demo ([a835135](https://github.com/studiometa/ui/commit/a835135))
- **Doc:** authorize requests from the playground ([b4e75b9](https://github.com/studiometa/ui/commit/b4e75b9))
- Update vitepress ([1a27f4a](https://github.com/studiometa/ui/commit/1a27f4a), [148a91a](https://github.com/studiometa/ui/commit/148a91a))
- Update @studiometa/js-toolkit ([54a39c3](https://github.com/studiometa/ui/commit/54a39c3))

### Fixed

- **Slider:** fix SliderItem.rect being sometimes undefined ([09a4073](https://github.com/studiometa/ui/commit/09a4073))

## v0.2.23 (2022-11-17)

### Added

- **FigureTwicpics:**
  - Add support for Twicpics placeholders ([6c55dbe](https://github.com/studiometa/ui/commit/6c55dbe))

### Fixed

- Fix dead links in the docs preventing build ([e10257b](https://github.com/studiometa/ui/commit/e10257b))
- **FigureTwicpics:**
  - Fix a bug where image were loaded multiple times ([a3480ca](https://github.com/studiometa/ui/commit/a3480ca))

## v0.2.22 (2022-11-17)

### Fixed

- **FigureTwicpics:**
  - Fix potential infinite loop in Twig template ([90e3a6e](https://github.com/studiometa/ui/commit/90e3a6e))

### Changed

- Update studiometa/twig-toolkit 1.3.0 → 1.3.1 ([ed74555](https://github.com/studiometa/ui/commit/ed74555))

## v0.2.21 (2022-11-17)

### Fixed

- Fix test failing following renaming of `FigureTwicPics` in `FigureTwicpics` ([#92](https://github.com/studiometa/ui/pull/92))

## v0.2.20 (2022-11-17)

### Added

- **FigureTwicpics**
  - Add a Twig template to enable usage of Twicpics API without lazyload ([#91](https://github.com/studiometa/ui/pull/91))
- **Twig Extension**
  - Add a `twig_toolkit_url` function from [studiometa/twig-toolkit@1.3.0](https://github.com/studiometa/twig-toolkit/releases/tag/1.3.0) ([#91](https://github.com/studiometa/ui/pull/91))

### Fixed

- **FigureTwicpics**
  - Fix the source not updating on window resize ([#91](https://github.com/studiometa/ui/pull/91))
