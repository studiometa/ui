# @studiometa/ui packages

## Commit messages

- Use English for commit messages
- Use simple verb-first sentences (e.g., "Add...", "Fix...", "Refactor...")

## Project structure

- Monorepo managed by NPM with packages in the `./packages` folder
- NPM packages in this repository are ESM only, CJS should never be used
- The main NPM package is `@studiometa/ui` and lives in `./packages/ui`
- A Composer package providing a Twig extension can be found in `./packages/twig-extension`

## Development

- Start the project locally with `ddev start`, the URL is `https://ui.ddev.site`
- Start the docs development server with `npm run docs:dev`
- Build the docs with `npm run docs:build`

## Tests

- Tests for the TypeScript components exported by the `@studiometa/ui` packages are managed by Vitest and are located in the `./packages/tests` folder, they can be run with the `npm run test` command or `npm run test -- -- <vitest args>` from the root of the project
- Code coverage for Vitest can be enabled with the command `npm run test -- -- --coverage.enabled`
- Tests for the Composer package are managed by Pest and located in the `./tests` folder and can be run with the `composer test` command
- Code coverage for Pest can be enabled with the command `XDEBUG_MODE=coverage composer test -- --coverage`

## Code quality

- Use `npm run lint` for TypeScript code quality
- Use `composer lint` to check for PHP Code Quality
- Use `composer fix` to fix fixable code quality errors reported by the `composer lint` command

## Changelog

- **Never edit `CHANGELOG.md` directly.** Each pull request adds a fragment `.changelog/<slug>.md` (slug = branch name without its prefix, e.g. `feat/v2-sheet` → `v2-sheet.md`)
- A fragment only contains `### Added|Changed|Deprecated|Removed|Fixed|Security|Dependencies` headings, each followed by its entries — no `#`/`##` heading
- **Do not write the pull request number**: the release appends `([#N])` and its link definition from the merged pull request that added the fragment
- Prefix entries with the component or package, e.g. `- **Fetch:** …` or `- **@studiometa/ui-mapbox:** …`, and mark breaking changes with `⚠️`
- The `changelog` check fails when a pull request changes a published package (`packages/ui`, `packages/ui-mapbox`, `packages/ui-motion`, `packages/eslint-plugin-ui`, `packages/twig-extension`) without a fragment; set the `no-changelog` label for changes users do not see (tests, docs, refactors, tooling)
- Format and tooling: [`weareikko/changelog`](https://github.com/weareikko/changelog)

## Releases

- Each merge into `2.x` releases 2.x: the `release` workflow (`.github/workflows/publish.yml`) runs the checks, then the `weareikko/changelog` action computes the version from the fragments, folds `.changelog/` into `CHANGELOG.md`, bumps every package and `composer.json`, commits `Prepare <version>`, tags `<version>` (no `v` prefix), pushes and creates the GitHub release; the publish job then publishes the npm packages (`next` dist-tag). Packagist reads the tag. A merge without a fragment releases nothing
- Do not bump versions, tag or create GitHub releases by hand. To force a bump, run the workflow: `gh workflow run publish.yml --ref 2.x -f version=major` (or `patch`, `minor`)
- `.changelog/prerelease` holds the prerelease identifier (`alpha`): while it exists, each merge releases the next prerelease (`2.0.0-alpha.2`, `2.0.0-alpha.3`…). Change it to `beta` or `rc` to start that identifier at 0. **Deleting it releases `2.0.0`** on the next merge, also without a new fragment. See [Prereleases](https://github.com/weareikko/changelog#prereleases)
- npm trusted publishing (OIDC, no npm token) is configured for `publish.yml`: keep the publish job in that file. Each package has its own `JS-DevTools/npm-publish` step, which skips a version that npm already has: when the publication fails, use "Re-run failed jobs" on the run
- The root `postversion` script only updates `composer.json`: the action runs `npm version <version> --workspaces --include-workspace-root`, which bumps every package
- Two release lines: `main` releases 1.x (npm `latest` dist-tag) and `2.x` releases 2.x (npm `next` dist-tag), each on merge into its branch. Merge `main` into `2.x` after the `release` run of `main` has finished: unreleased fragments from `main` would otherwise go into the next 2.x release too

## Code conventions

- Private and protected class members use the `__` prefix (double underscore), documented with an `@private`/`@protected` docblock — never the TypeScript `private`/`protected` keywords, and never the JavaScript `#` prefix (which is unsupported on old browsers). The `__` prefix keeps members runtime-discoverable while debugging. Prefer bare `__field` declarations for simple fields (matching the existing style, e.g. `__index`) and add the docblock on methods and getters.
- Only use erasable TypeScript syntax: do not use non-erasable features such as `enum`, `namespace`, or constructor parameter-properties (`constructor(private foo)`).

## Playground

If you see a link to `https://ui.studiometa.dev/play/`, it is a link to the playground for all components. You can either visit the page to see how it renders, or directly extract the content from the URL query string stored in the URL hash. The content is encoded and zipped, you can unzip it with the `unzip` export from the `@studiometa/playground` NPM package.
