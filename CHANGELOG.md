# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Add support for fallback images ([#196](https://github.com/studiometa/ui/pull/196), [4e64628](https://github.com/studiometa/ui/commit/4e64628))

### Changed

- Update studiometa/twig-toolkit v2.0 → v2.1 ([#196](https://github.com/studiometa/ui/pull/196), [83ec85a](https://github.com/studiometa/ui/commit/83ec85a))

## [v1.0.0-rc.6](https://github.com/studiometa/ui/compare/1.0.0-rc.5..1.0.0-rc.6) (2025-06-05)

### Added

- **ImageGrid:** add an `image` block ([#411](https://github.com/studiometa/ui/pull/411), [f128a88](https://github.com/studiometa/ui/commit/f128a88))

### Fixed

- **ImageGrid:** fix responsive ([#411](https://github.com/studiometa/ui/pull/411), [dffda1e](https://github.com/studiometa/ui/commit/dffda1e))
- Fix some Twig JS incompatibilities ([#416](https://github.com/studiometa/ui/pull/416), [60c7faa](https://github.com/studiometa/ui/commit/60c7faa))

## [v1.0.0-rc.5](https://github.com/studiometa/ui/compare/1.0.0-rc.4..1.0.0-rc.5) (2025-05-28)

### Added

- **Prefetch:** add a `prefetched` event ([#409](https://github.com/studiometa/ui/pull/409), [27c91a8](https://github.com/studiometa/ui/commit/27c91a8))

### Modified

- **Prefetch:** refactor the prefetch components `AbstractPrefetch`, `PrefetchWhenOver` and `PrefetchWhenVisible` ([#409](https://github.com/studiometa/ui/pull/409), [fbf5a25](https://github.com/studiometa/ui/commit/fbf5a25))

### Fixed

- **Menu:** fix a bug when the Menu is extended ([#406](https://github.com/studiometa/ui/pull/406), [c9d083d](https://github.com/studiometa/ui/commit/c9d083d))

## [v1.0.0-rc.4](https://github.com/studiometa/ui/compare/1.0.0-rc.3..1.0.0-rc.4) (2025-05-27)

### Fixed

- **Menu:**
  - Fix detection of ancestor ([#403](https://github.com/studiometa/ui/pull/403), [a99610c](https://github.com/studiometa/ui/commit/a99610c))
  - Fix closing of menu on click outside ([#403](https://github.com/studiometa/ui/pull/403), [923566e](https://github.com/studiometa/ui/commit/923566e))

## [v1.0.0-rc.3](https://github.com/studiometa/ui/compare/1.0.0-rc.2..1.0.0-rc.3) (2025-05-23)

### Added

- Add a new `Hoverable` component ([#401](https://github.com/studiometa/ui/pull/401), [2bced85](https://github.com/studiometa/ui/commit/2bced85))

## [v1.0.0-rc.2](https://github.com/studiometa/ui/compare/1.0.0-rc.1..1.0.0-rc.2) (2025-05-12)

### Changed

- ⚠️ **Draggable:** refactor component to add support for bounds, axis options and events ([#388](https://github.com/studiometa/ui/pull/388))

### Fixed

- **Frame:** fix accessing refs and components if they are not present ([#393](https://github.com/studiometa/ui/pull/393), [c997008](https://github.com/studiometa/ui/commit/c997008))

### Dependencies

- Update dependency [@studiometa/js-toolkit](https://github.com/studiometa/js-toolkit) to v3.0.4 ([#395](https://github.com/studiometa/ui/pull/395), [8819913](https://github.com/studiometa/ui/commit/8819913))

## [v1.0.0-rc.1](https://github.com/studiometa/ui/compare/1.0.0-rc.0..1.0.0-rc.1) (2025-05-05)

### Added

- **StyledButton:** add a `size` parameter ([#378](https://github.com/studiometa/ui/pull/378), [9f24dee](https://github.com/studiometa/ui/commit/9f24dee))

### Fixed

- **Slider:** fix a bug where dots transition were triggered without changing slide ([#382](https://github.com/studiometa/ui/pull/382), [21c552a](https://github.com/studiometa/ui/commit/21c552a))
- **DataBind:** fix binding on textarea ([#378](https://github.com/studiometa/ui/pull/378), [9d8879f](https://github.com/studiometa/ui/commit/9d8879f))

### Changed

- **Slider:** improve performance of the `SliderCount` component ([#382](https://github.com/studiometa/ui/pull/382), [ddecd7d](https://github.com/studiometa/ui/commit/ddecd7d), [da7e5b6](https://github.com/studiometa/ui/commit/da7e5b6))
- ⚠️ **Frame:** refactor components for better usability ([#378](https://github.com/studiometa/ui/pull/378))
- **Transition:** refactor group syncing to fix flickering ([#378](https://github.com/studiometa/ui/pull/378), [902cd6c](https://github.com/studiometa/ui/commit/902cd6c))
- **Draggable:** improve performance by preventing layout thrashing ([#378](https://github.com/studiometa/ui/pull/378), [83c2095](https://github.com/studiometa/ui/commit/83c2095))
- **StyledButton:** change default size of styled button ([#378](https://github.com/studiometa/ui/pull/378), [d4d975d](https://github.com/studiometa/ui/commit/d4d975d))

### Removed

- ⚠️ **Slider:** remove complex calculation from the Slider component ([#382](https://github.com/studiometa/ui/pull/382), [74e2638](https://github.com/studiometa/ui/commit/74e2638))
- ⚠️ **Button:** remove the `icon_classes` parameter ([#378](https://github.com/studiometa/ui/pull/378), [42bb524](https://github.com/studiometa/ui/commit/42bb524))

## [v1.0.0-rc.0](https://github.com/studiometa/ui/compare/1.0.0-beta.1..1.0.0-rc.0) (2025-04-16)

### Changed

- ⚠️ Switch LICENSE from MIT to FSL ([dd01b91](https://github.com/studiometa/ui/commit/dd01b91))
- ⚠️ Implement `attr` API for all Twig components ([#70](https://github.com/studiometa/ui/issues/70), [#374](https://github.com/studiometa/ui/pull/374), [d3ba69c](https://github.com/studiometa/ui/commit/d3ba69c))

### Removed

- **Docs:** remove deprecated demos ([#369](https://github.com/studiometa/ui/issues/369), [#375](https://github.com/studiometa/ui/pull/375), [b442195](https://github.com/studiometa/ui/commit/b442195))
- ⚠️ Remove the deprecated TableOfContent component ([#372](https://github.com/studiometa/ui/issues/372), [#373](https://github.com/studiometa/ui/pull/373), [14d2c34](https://github.com/studiometa/ui/commit/14d2c34))

## [v1.0.0-beta.1](https://github.com/studiometa/ui/compare/1.0.0-beta.0..1.0.0-beta.1) (2025-04-14)

### Fixed

- Fix a dependency conflit ([#371](https://github.com/studiometa/ui/pull/371), [3c0b290](https://github.com/studiometa/ui/commit/3c0b290))

### Dependencies

- Update dependency oxlint to v0.15.12 ([#366](https://github.com/studiometa/ui/pull/366), [75fc0ad](https://github.com/studiometa/ui/commit/75fc0ad))
- Update dependency oxlint to v0.15.11 ([#362](https://github.com/studiometa/ui/pull/362), [86f532e](https://github.com/studiometa/ui/commit/86f532e))
- Update dependency @iconify-json/octicon to v1.2.5 ([#361](https://github.com/studiometa/ui/pull/361), [d023417](https://github.com/studiometa/ui/commit/d023417))
- Update dependency @iconify-json/octicon to v1.2.4 ([#359](https://github.com/studiometa/ui/pull/359), [c664631](https://github.com/studiometa/ui/commit/c664631))
- Update dependency @iconify-json/octicon to v1.2.3 ([#356](https://github.com/studiometa/ui/pull/356), [7562ee1](https://github.com/studiometa/ui/commit/7562ee1))
- Update dependency oxlint to v0.15.10 ([#357](https://github.com/studiometa/ui/pull/357), [fc6bdcf](https://github.com/studiometa/ui/commit/fc6bdcf))
- Update dependency oxlint to v0.15.8 ([#355](https://github.com/studiometa/ui/pull/355), [6491759](https://github.com/studiometa/ui/commit/6491759))
- Update dependency twig/twig to v3.19.0 [SECURITY] ([#354](https://github.com/studiometa/ui/pull/354), [e278502](https://github.com/studiometa/ui/commit/e278502))
- Update dependency vitepress to v1.6.3 ([#352](https://github.com/studiometa/ui/pull/352), [e514f1c](https://github.com/studiometa/ui/commit/e514f1c))
- Update vueuse monorepo to v12.5.0 ([#353](https://github.com/studiometa/ui/pull/353), [86f24be](https://github.com/studiometa/ui/commit/86f24be))

## [v1.0.0-beta.0](https://github.com/studiometa/ui/compare/1.0.0-alpha.14..1.0.0-beta.0) (2025-01-21)

### Added

- **Icon:** add support for icon sets ([#344](https://github.com/studiometa/ui/pull/344), [090b1b1](https://github.com/studiometa/ui/commit/090b1b1))
- **TwigExtension:** add a `meta_icon('collection:icon')` Twig function ([#223](https://github.com/studiometa/ui/issues/223), [#344](https://github.com/studiometa/ui/pull/344), [7dfb635](https://github.com/studiometa/ui/commit/7dfb635))
- Add support for PHP 8.4 ([#348](https://github.com/studiometa/ui/pull/348))

### Changed

- ⚠️ Remove the atomic folders ([#343](https://github.com/studiometa/ui/pull/343), [a61d8e6](https://github.com/studiometa/ui/commit/a61d8e6))
- ⚠️ Upgrade twig/twig to ^3.0 ([#348](https://github.com/studiometa/ui/pull/348), [c8e3830](https://github.com/studiometa/ui/commit/c8e3830))
- ⚠️ Upgrade studiometa/twig-toolkit to ^2.0 ([#348](https://github.com/studiometa/ui/pull/348), [39b43c8](https://github.com/studiometa/ui/commit/39b43c8))
- Upgrade @studiometa/js-toolkit to ^3.0 ([#350](https://github.com/studiometa/ui/pull/350), [439288a](https://github.com/studiometa/ui/commit/439288a))

### Removed

- ⚠️ **Icon:** remove the deprecated version ([#344](https://github.com/studiometa/ui/pull/344), [c8a4001](https://github.com/studiometa/ui/commit/c8a4001))
- Remove component specific package.json file ([#343](https://github.com/studiometa/ui/pull/343), [6c29694](https://github.com/studiometa/ui/commit/6c29694))

## [v1.0.0-alpha.14](https://github.com/studiometa/ui/compare/1.0.0-alpha.13..1.0.0-alpha.14) (2025-01-15)

### Fixed

- **Frame:** fix compatibility with latest @studiometa/js-toolkit beta version ([#341](https://github.com/studiometa/ui/pull/341), [4595aff](https://github.com/studiometa/ui/commit/4595aff))
- **CircularMarquee:** fix a potential Twig error ([#341](https://github.com/studiometa/ui/pull/341), [3714905](https://github.com/studiometa/ui/commit/3714905))
- **IconList:** fix a potential Twig error ([#341](https://github.com/studiometa/ui/pull/341), [6b1d3ec](https://github.com/studiometa/ui/commit/6b1d3ec))

### Changed

- Update dependencies ([#341](https://github.com/studiometa/ui/pull/341), [e2e8514](https://github.com/studiometa/ui/commit/e2e8514), [d2f9714](https://github.com/studiometa/ui/commit/d2f9714))

## [v1.0.0-alpha.13](https://github.com/studiometa/ui/compare/1.0.0-alpha.12..1.0.0-alpha.13) (2024-11-14)

### Changed

- ⚠️ Bump minimum PHP version for the package to 8.1 ([#318](https://github.com/studiometa/ui/pull/318), [512f076](https://github.com/studiometa/ui/commit/512f076))

## [v1.0.0-alpha.12](https://github.com/studiometa/ui/compare/1.0.0-alpha.11..1.0.0-alpha.12) (2024-11-11)

### Fixed

- Fix composer dependencies [e0a2e02](https://github.com/studiometa/ui/commit/e0a2e02)

## [v1.0.0-alpha.11](https://github.com/studiometa/ui/compare/1.0.0-alpha.10..1.0.0-alpha.11) (2024-11-11)

### Fixed

- Fix version number [d539eea](https://github.com/studiometa/ui/commit/d539eea)

## [v1.0.0-alpha.10](https://github.com/studiometa/ui/compare/1.0.0-alpha.9..1.0.0-alpha.10) (2024-11-07)

### Added

- Add the administration of demos from the back-office [4d534ca](https://github.com/studiometa/ui/commit/4d534ca)
- Add user authentification [27b68b5](https://github.com/studiometa/ui/commit/27b68b5)

## [v1.0.0-alpha.9](https://github.com/studiometa/ui/compare/1.0.0-alpha.8..1.0.0-alpha.9) (2024-10-15)

### Added

- Add a [FigureShopify](https://ui.studiometa.dev/-/components/FigureShopify/) component ([#303](https://github.com/studiometa/ui/pull/303))
- **Transition:** add support for grouped transitions ([#305](https://github.com/studiometa/ui/issues/305), [#306](https://github.com/studiometa/ui/pull/306), [be85501](https://github.com/studiometa/ui/commit/be85501))

## [v1.0.0-alpha.8](https://github.com/studiometa/ui/compare/1.0.0-alpha.7..1.0.0-alpha.8) (2024-09-25)

### Added

- **Action:** add support for handling multiple events ([#298](https://github.com/studiometa/ui/issues/298), [#299](https://github.com/studiometa/ui/pull/299), [b739f2b](https://github.com/studiometa/ui/commit/b739f2b))

### Changed

- ⚠️ **DataBind:** rename the `name` option to `group` ([#288](https://github.com/studiometa/ui/issues/288), [#297](https://github.com/studiometa/ui/pull/297), [5ea37c9](https://github.com/studiometa/ui/commit/5ea37c9))

## [v1.0.0-alpha.7](https://github.com/studiometa/ui/compare/1.0.0-alpha.6..1.0.0-alpha.7) (2024-09-10)

### Fixed

- **DataBind:** fix inconsistencies with removed DOM elements ([#293](https://github.com/studiometa/ui/issues/293), [#294](https://github.com/studiometa/ui/pull/294), [de945b1](https://github.com/studiometa/ui/commit/de945b1))

### Changed

- Update @studiometa/js-toolkit 3.0.0-alpha.9 → 3.0.0-alpha.10 ([3adbebc](https://github.com/studiometa/ui/commit/3adbebc))

## [v1.0.0-alpha.6](https://github.com/studiometa/ui/compare/1.0.0-alpha.5..1.0.0-alpha.6) (2024-08-27)

### Added

- Add support for targeting self by default ([#290](https://github.com/studiometa/ui/issues/290), [#291](https://github.com/studiometa/ui/pull/291), [2951299](https://github.com/studiometa/ui/commit/2951299))
- Add support for self reference in the effect ([#290](https://github.com/studiometa/ui/issues/290), [#291](https://github.com/studiometa/ui/pull/291), [0eac076](https://github.com/studiometa/ui/commit/0eac076))

### Changed

- Update [@studiometa/js-toolkit](https://github.com/studiometa/js-toolkit) to 3.0.0-alpha.9 ([6c1a8c7](https://github.com/studiometa/ui/commit/6c1a8c7))

## [v1.0.0-alpha.5](https://github.com/studiometa/ui/compare/1.0.0-alpha.4..1.0.0-alpha.5) (2024-08-06)

### Fixed

- Fix publication with GitHub actions ([cb6381f](https://github.com/studiometa/ui/commit/cb6381f))

## [v1.0.0-alpha.4](https://github.com/studiometa/ui/compare/1.0.0-alpha.3..1.0.0-alpha.4) (2024-08-05)

### Fixed

- Fix release and publish GitHub Action ([173aff6](https://github.com/studiometa/ui/commit/173aff6))

### Changed

- Update @studiometa/playground 0.1.3 → 0.1.4 ([e82f93a](https://github.com/studiometa/ui/commit/e82f93a))

## [v1.0.0-alpha.3](https://github.com/studiometa/ui/compare/1.0.0-alpha.2..1.0.0-alpha.3) (2024-08-02)

### Changed

- Migrate tests to Vitest ([#283](https://github.com/studiometa/ui/pull/283), [b76a444](https://github.com/studiometa/ui/commit/b76a444))
- ⚠️ Update @studiometa/js-toolkit 3.0.0-alpha.5 → 3.0.0-alpha.6 ([#284](https://github.com/studiometa/ui/pull/284), [c6f5dd7](https://github.com/studiometa/ui/commit/c6f5dd7))

## [v1.0.0-alpha.2](https://github.com/studiometa/ui/compare/1.0.0-alpha.1..1.0.0-alpha.2) (2024-08-01)

### Changed

- **DataBind:** add support for more reactivity ([#279](https://github.com/studiometa/ui/issues/279), [#281](https://github.com/studiometa/ui/pull/281), [dbe37a3](https://github.com/studiometa/ui/commit/dbe37a3))

### Removed

- ⚠️ Remove the .cjs files from the package ([#282](https://github.com/studiometa/ui/pull/282), [6574212](https://github.com/studiometa/ui/commit/6574212))

## [v1.0.0-alpha.1](https://github.com/studiometa/ui/compare/1.0.0-alpha.0..1.0.0-alpha.1) (2024-07-31)

### Fixed

- **DataBind:** fix tracking values for multiple checkboxes ([#275](https://github.com/studiometa/ui/issues/275), [#276](https://github.com/studiometa/ui/pull/276), [d8c8c69](https://github.com/studiometa/ui/commit/d8c8c69))

## [v1.0.0-alpha.0](https://github.com/studiometa/ui/compare/0.2.53..1.0.0-alpha.0) (2024-07-29)

### Added

- **DataBind:** add `value` getter and setter as alias for the `get()` and `set(value)` methods ([#265](https://github.com/studiometa/ui/pull/265), [de1e36b](https://github.com/studiometa/ui/commits/de1e36b))
- **Action:** add a `Target` bare component for easy reference ([#261](https://github.com/studiometa/ui/pull/261))

### Changed

- ⚠️ Update @studiometa/js-toolkit 2.12.0 → 3.0.0-alpha.5 ([#264](https://github.com/studiometa/ui/pull/264), [27684a2](https://github.com/studiometa/ui/commits/27684a2))
- ⚠️ **Action:** add support for effect and improve target resolution ([#258](https://github.com/studiometa/ui/issues/258), [#261](https://github.com/studiometa/ui/pull/261))

### Fixed

- **Button:** fix an error where a variable might not be defined ([2b00b60](https://github.com/studiometa/ui/commits/2b00b60))
- **IconInline:** fix an error where a variable might not be defined ([72153ce](https://github.com/studiometa/ui/commits/72153ce))

### Removed

- ⚠️ **Action:** remove `method` and `selector` options ([#258](https://github.com/studiometa/ui/issues/258), [#261](https://github.com/studiometa/ui/pull/261), [6b1ab86](https://github.com/studiometa/ui/commits/6b1ab86))

## [v0.2.53](https://github.com/studiometa/ui/compare/0.2.52..0.2.53) (2024-07-16)

### Added

- Add `DataBind`, `DataModel`, `DataEffect` and `DataComputed` components ([#256](https://github.com/studiometa/ui/pull/256))

### Changed

- Update Node 20 → 22 ([#257](https://github.com/studiometa/ui/pull/257), 4f2d947)
- Add a Dockerfile for easy deployment of the documentation ([#257](https://github.com/studiometa/ui/pull/257), 016a509)

## [v0.2.52](https://github.com/studiometa/ui/compare/0.2.51..0.2.52) (2024-07-03)

### Added

- Add support for advanced TwicPics placeholder ([#251](https://github.com/studiometa/ui/pull/251))

### Dependencies

- Lock file maintenance ([dc4606e](https://github.com/studiometa/ui/commits/dc4606e), [d72d430](https://github.com/studiometa/ui/commits/d72d430))
- Update dependency @iconify-json/octicon to v1.1.55 ([f00c80f](https://github.com/studiometa/ui/commits/f00c80f))
- Update dependency esbuild to v0.21.5 ([1a19693](https://github.com/studiometa/ui/commits/1a19693))
- Update dependency oxlint to v0.4.3 ([1f8a90a](https://github.com/studiometa/ui/commits/1f8a90a))
- Update dependency oxlint to v0.4.4 ([d443a78](https://github.com/studiometa/ui/commits/d443a78))
- Update dependency oxlint to v0.5.0 ([cc971c2](https://github.com/studiometa/ui/commits/cc971c2))
- Update dependency unplugin-vue-components to v0.27.2 ([0f05cec](https://github.com/studiometa/ui/commits/0f05cec))

## [v0.2.51](https://github.com/studiometa/ui/compare/0.2.50..0.2.51) (2024-06-24)

### Fixed

- Fix the condition for displaying the Reinsurance molecule icon ([#247](https://github.com/studiometa/ui/pull/247))

## [v0.2.50](https://github.com/studiometa/ui/compare/0.2.49..0.2.50) (2024-06-10)

### Fixed

- Replace `twitter.svg` symlink by a svg file because it is not supported by TailwindCSS during the compilation ([#238](https://github.com/studiometa/ui/pull/238))

## [v0.2.49](https://github.com/studiometa/ui/compare/0.2.48..0.2.49) (2024-05-27)

### Added

- **Demos:** Add a Navbar component ([#198](https://github.com/studiometa/ui/pull/198))
- Add a `IconList` molecule who displays a list of clickable icons ([#201](https://github.com/studiometa/ui/pull/201))
- Add a `ignore_missing` option to the `IconInline` and `IconInlineImg` components to avoid empty tag printing ([#201](https://github.com/studiometa/ui/pull/201))
- Add the `icon_attr` option on the `Button` to pass attr directly to the `IconInline` component ([#201](https://github.com/studiometa/ui/pull/201))
- Add some brand new 24x24 svg icons : at, copy, instagram, link, linkedin, mail, phone, pinterest, tiktok, whatsapp, x ([#201](https://github.com/studiometa/ui/pull/201))

### Changed

- `Button` component now use `IconInline` instead of the deprecated `Icon` component. ([#201](https://github.com/studiometa/ui/pull/201))
- Globe and Facebook svg icons have now a dimension of 24x24 ([#201](https://github.com/studiometa/ui/pull/201))
- Twitter svg icon is now a symlink to X and have a dimension of 24x24 ([#201](https://github.com/studiometa/ui/pull/201))

### Dependencies

- Update dependency @iconify-json/octicon to v1.1.54 ([6599061](https://github.com/studiometa/ui/commits/6599061))
- Update dependency esbuild to ^0.21.0 ([777f416](https://github.com/studiometa/ui/commits/777f416))
- Update dependency oxlint to ^0.4.0 ([f3905cb](https://github.com/studiometa/ui/commits/f3905cb))
- Update dependency studiometa/twig-toolkit to v1.3.6 ([63b6ce8](https://github.com/studiometa/ui/commits/63b6ce8))
- Update dependency twig/twig to v3.10.2 ([99164e3](https://github.com/studiometa/ui/commits/99164e3))
- Update dependency twig/twig to v3.10.3 ([1bbdf25](https://github.com/studiometa/ui/commits/1bbdf25))
- Update dependency unplugin-icons to ^0.19.0 ([f0f7833](https://github.com/studiometa/ui/commits/f0f7833))
- Update dependency vitepress to v1.1.4 ([c0d951e](https://github.com/studiometa/ui/commits/c0d951e))
- Update dependency vitepress to v1.2.2 ([37afc6f](https://github.com/studiometa/ui/commits/37afc6f))

## [v0.2.48](https://github.com/studiometa/ui/compare/0.2.47..0.2.48) (2024-04-17)

### Added

- Add a `ui.ease` Twig global object to the Twig extension ([#195](https://github.com/studiometa/ui/pull/195))
- Add `AnchorNav`, `AnchorNavLink` and `AnchorNavTarget` JavaScript components ([#185](https://github.com/studiometa/ui/pull/185))
- Add JS and Twig `FigureVideo` and `FigureVideoTwicpics` components ([#193](https://github.com/studiometa/ui/pull/193))
- Add handling of POST requests for the `Frame` component ([#194](https://github.com/studiometa/ui/pull/194))
- Add documentaion for the `Frame` component ([#194](https://github.com/studiometa/ui/pull/194))

## [v0.2.47](https://github.com/studiometa/ui/compare/0.2.46..0.2.47) (2024-03-22)

### Added

- Add a `withDeprecation` decorator ([40d2ffe](https://github.com/studiometa/ui/commits/40d2ffe))

### Fixed

- Update docs dependencies ([93a4aaf](https://github.com/studiometa/ui/commits/93a4aaf))
- Update dependencies ([62f139d](https://github.com/studiometa/ui/commits/62f139d))
- Remove a dumped variable from the doc ([0df567f](https://github.com/studiometa/ui/commits/0df567f))
- Fix dependency installation ([c5c40ae](https://github.com/studiometa/ui/commits/c5c40ae))

### Changed

- Deprecate the `TableOfContent...` components ([2fcd95f](https://github.com/studiometa/ui/commits/2fcd95f))
- Replace ESLint by oxlint ([e774114](https://github.com/studiometa/ui/commits/e774114))

## [v0.2.46](https://github.com/studiometa/ui/compare/0.2.45..0.2.46) (2024-03-22)

### Fixed

- Fix docs playground preview displaying nothing ([#189](https://github.com/studiometa/ui/pull/189), [fa59c05](https://github.com/studiometa/ui/commit/fa59c05))
- Update doc with correct syntax highlighting ([#189](https://github.com/studiometa/ui/pull/189), [1154d19](https://github.com/studiometa/ui/commit/1154d19))

## [v0.2.45](https://github.com/studiometa/ui/compare/0.2.44..0.2.45) (2024-03-22)

### Added

- Add a **Demo** section inside the documentation to provide **copy/paste** ready components and a collection of experiments ([#178](https://github.com/studiometa/ui/pull/178))
- Add a Twig `MapboxStaticMap` component ([#175](https://github.com/studiometa/ui/pull/175))
- Add a Twig `Reinsurance` component ([#181](https://github.com/studiometa/ui/pull/181))
- **Slider:** add accessibility attributes to mounted hook for `Slider` and `SliderItem` components ([#136](https://github.com/studiometa/ui/pull/136))
- **FigureTwicpics:** add `disable` option ([#176](https://github.com/studiometa/ui/pull/176))
- **Demos:** add a section with sticky cards and a 3D effect while scrolling ([#187](https://github.com/studiometa/ui/pull/187))

### Fixed

- **SliderItem:** fix accessibility issue were screen readers could not access all slides as the ones out of view had an `aria-hidden="true"` attribute ([#136](https://github.com/studiometa/ui/pull/136))
- Fix potential errors in development with mismatch in Node versions ([#179](https://github.com/studiometa/ui/pull/179))

## [v0.2.44](https://github.com/studiometa/ui/compare/0.2.43..0.2.44) (2024-02-29)

### Added

- Add the **Action** atom ([#161](https://github.com/studiometa/ui/issues/161), [#165](https://github.com/studiometa/ui/pull/165))
- Add the **CircularMarquee** atom ([#171](https://github.com/studiometa/ui/pull/171))
- Add the device pixel ratio support for **FigureTwicpics** atom ([#173](https://github.com/studiometa/ui/pull/173))

## [v0.2.43](https://github.com/studiometa/ui/compare/0.2.42..0.2.43) (2024-02-14)

### Changed

- Improve the DX of the documentation and playground ([#167](https://github.com/studiometa/ui/pull/167))

## [v0.2.42](https://github.com/studiometa/ui/compare/0.2.41..0.2.42) (2024-02-13)

### Fixed

- Fix the docs production build ([2676812](https://github.com/studiometa/ui/commit/2676812), [d29c08d](https://github.com/studiometa/ui/commit/d29c08d))
- Fix the monaco-editor patch for Twig ([262754c](https://github.com/studiometa/ui/commit/262754c))

## [v0.2.41](https://github.com/studiometa/ui/compare/0.2.40..0.2.41) (2024-02-13)

### Changed

- **Docs:** use the playground to render examples ([#152](https://github.com/studiometa/ui/pull/152))

## [v0.2.40](https://github.com/studiometa/ui/compare/0.2.39..0.2.40) (2023-10-23)

### Fixed

- **Playground:** fix Twig syntax highlighting in playground ([91f5b93](https://github.com/studiometa/ui/commit/91f5b93))

## [v0.2.39](https://github.com/studiometa/ui/compare/0.2.38..0.2.39) (2023-10-23)

### Changed

- **Docs:** update NPM dependencies ([bc15cc4](https://github.com/studiometa/ui/commit/bc15cc4))
- **Docs:** add sitemap ([69835fb](https://github.com/studiometa/ui/commit/69835fb))
- **Playground:** update NPM dependencies ([b0c196e](https://github.com/studiometa/ui/commit/b0c196e))

## [v0.2.38](https://github.com/studiometa/ui/compare/0.2.37..0.2.38) (2023-10-21)

### Changed

- **Playground:** add ability to mask the header ([#149](https://github.com/studiometa/ui/pull/149))
- **Playground:** add right and bottom layouts ([#149](https://github.com/studiometa/ui/pull/149))
- **Playground:** add support for controlling editors display from URL ([#149](https://github.com/studiometa/ui/pull/149))

## [v0.2.37](https://github.com/studiometa/ui/compare/0.2.36..0.2.37) (2023-09-22)

### Fixed

- Fix a package-lock conflict blocking GitHub Actions ([4a25aff](https://github.com/studiometa/ui/commit/4a25aff))

## [v0.2.36](https://github.com/studiometa/ui/compare/0.2.35..0.2.36) (2023-09-21)

### Fixed

- **IconImgInline:** fix accessibility issues ([#143](https://github.com/studiometa/ui/pull/143))

### Removed

- **Playground:** remove previews ([8afde76](https://github.com/studiometa/ui/commit/8afde76))

## [v0.2.35](https://github.com/studiometa/ui/compare/0.2.34..0.2.35) (2023-07-18)

### Fixed

- Update `package-lock.json` ([388284c](https://github.com/studiometa/ui/commit/388284c))

## [v0.2.34](https://github.com/studiometa/ui/compare/0.2.33..0.2.34) (2023-07-17)

### Changed

- **Figure**: improve Figure image loading ([#133](https://github.com/studiometa/ui/pull/133), [59df52f](https://github.com/studiometa/ui/commit/59df52f))
- **FigureTwicpics**: improve FigureTwicpics image swap on resize ([#133](https://github.com/studiometa/ui/pull/133), [9eae6b0](https://github.com/studiometa/ui/commit/9eae6b0))

### Fixed

- **Playground**: fix init of monaco-editor ([#137](https://github.com/studiometa/ui/pull/137))

## [v0.2.33](https://github.com/studiometa/ui/compare/0.2.32..0.2.33) (2023-05-17)

### Fixed

- Always use https for TwicPics URLs ([#130](https://github.com/studiometa/ui/pull/130))

### Changed

- Update NPM dependencies ([#117](https://github.com/studiometa/ui/pull/117))
- Update Composer dependencies ([#129](https://github.com/studiometa/ui/pull/129))

## [v0.2.32](https://github.com/studiometa/ui/compare/0.2.31..0.2.32) (2023-04-26)

### Fixed

- Fix playground build ([af997ab](https://github.com/studiometa/ui/commit/af997ab))

### Changed

- Update NPM dependencies ([7faf168](https://github.com/studiometa/ui/commit/7faf168))
- Update playground NPM dependencies ([b8999c4](https://github.com/studiometa/ui/commit/b8999c4))
- Add favicon to the playground ([a318af7](https://github.com/studiometa/ui/commit/a318af7))
- Update all Composer dependencies ([#126](https://github.com/studiometa/ui/pull/126))

## [v0.2.31](https://github.com/studiometa/ui/compare/0.2.30..0.2.31) (2023-03-24)

### Fixed

- **Slider:** fix buttons ([1460eb2](https://github.com/studiometa/ui/commit/1460eb2))

## [v0.2.30](https://github.com/studiometa/ui/compare/0.2.29..0.2.30) (2023-03-02)

### Fixed

- **Docs:** fix build and deployment ([1caef03](https://github.com/studiometa/ui/commit/1caef03))

## [v0.2.29](https://github.com/studiometa/ui/compare/0.2.28..0.2.29) (2023-03-02)

### Added

- Add `IconInlineImg` template ([#118](https://github.com/studiometa/ui/pull/118))
- Add `IconInline` template to replace `Icon` ([#118](https://github.com/studiometa/ui/pull/118))

### Changed

- **Icon:** deprecate the `Icon` atom, use `IconInline` instead ([#118](https://github.com/studiometa/ui/pull/118))

### Fixed

- **FigureTwicpics:** fix TwicPics path being added twice ([#120](https://github.com/studiometa/ui/pull/120))

## [v0.2.28](https://github.com/studiometa/ui/compare/0.2.27..0.2.28) (2023-02-08)

### Added

- **Playground:**
  - add support for Twig and JS snippets autocompletion ([#114](https://github.com/studiometa/ui/pull/114), [54322cb](https://github.com/studiometa/ui/commit/54322cb))
  - add support for Emmet in the HTML editor ([#114](https://github.com/studiometa/ui/pull/114), [883e039](https://github.com/studiometa/ui/commit/883e039))
  - add support for import maps for the `@studiometa/` namespace ([#114](https://github.com/studiometa/ui/pull/114), [25052fd](https://github.com/studiometa/ui/commit/25052fd))

### Fixed

- **Playground:**
  - fix Twig auto-indent not working for HTML elements ([#114](https://github.com/studiometa/ui/pull/114), [de6e560](https://github.com/studiometa/ui/commit/de6e560))
  - fix a bug where HTML content was sometimes `undefined` ([#114](https://github.com/studiometa/ui/pull/114), [f542fb9](https://github.com/studiometa/ui/commit/f542fb9))
  - improve layout on small screens ([#114](https://github.com/studiometa/ui/pull/114), [d178ce8](https://github.com/studiometa/ui/commit/d178ce8))

## [v0.2.27](https://github.com/studiometa/ui/compare/0.2.26..0.2.27) (2023-02-02)

### Added

- Add the playground to the NPM workspace ([#112](https://github.com/studiometa/ui/pull/112))

## [v0.2.26](https://github.com/studiometa/ui/compare/0.2.25..0.2.26) (2023-01-30)

### Fixed

- Fix playground access to the API ([a90aef2](https://github.com/studiometa/ui/commit/a90aef2))

## [v0.2.25](https://github.com/studiometa/ui/compare/0.2.24..0.2.25) (2023-01-27)

### Fixed

- Fix production Dockerfile ([a1c74c2](https://github.com/studiometa/ui/commit/a1c74c2))

### Changed

- Update @studiometa/js-toolkit to 2.9.0 ([366f3b1](https://github.com/studiometa/ui/commit/366f3b1))

## [v0.2.24](https://github.com/studiometa/ui/compare/0.2.23..0.2.24) (2023-01-27)

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

## [v0.2.23](https://github.com/studiometa/ui/compare/0.2.22..0.2.23) (2022-11-17)

### Added

- **FigureTwicpics:**
  - Add support for Twicpics placeholders ([6c55dbe](https://github.com/studiometa/ui/commit/6c55dbe))

### Fixed

- Fix dead links in the docs preventing build ([e10257b](https://github.com/studiometa/ui/commit/e10257b))
- **FigureTwicpics:**
  - Fix a bug where image were loaded multiple times ([a3480ca](https://github.com/studiometa/ui/commit/a3480ca))

## [v0.2.22](https://github.com/studiometa/ui/compare/0.2.21..0.2.22) (2022-11-17)

### Fixed

- **FigureTwicpics:**
  - Fix potential infinite loop in Twig template ([90e3a6e](https://github.com/studiometa/ui/commit/90e3a6e))

### Changed

- Update studiometa/twig-toolkit 1.3.0 → 1.3.1 ([ed74555](https://github.com/studiometa/ui/commit/ed74555))

## [v0.2.21](https://github.com/studiometa/ui/compare/0.2.20..0.2.21) (2022-11-17)

### Fixed

- Fix test failing following renaming of `FigureTwicPics` in `FigureTwicpics` ([#92](https://github.com/studiometa/ui/pull/92))

## [v0.2.20](https://github.com/studiometa/ui/compare/0.2.19..0.2.20) (2022-11-17)

### Added

- **FigureTwicpics**
  - Add a Twig template to enable usage of Twicpics API without lazyload ([#91](https://github.com/studiometa/ui/pull/91))
- **Twig Extension**
  - Add a `twig_toolkit_url` function from [studiometa/twig-toolkit@1.3.0](https://github.com/studiometa/twig-toolkit/releases/tag/1.3.0) ([#91](https://github.com/studiometa/ui/pull/91))

### Fixed

- **FigureTwicpics**
  - Fix the source not updating on window resize ([#91](https://github.com/studiometa/ui/pull/91))
