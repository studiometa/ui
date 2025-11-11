# @studiometa/ui packages

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

## Playground

If you see a link to `https://ui.studiometa.dev/play/`, it is a link to the playground for all components. You can either visit the page to see how it renders, or directly extract the content from the URL query string stored in the URL hash. The content is encoded and zipped, you can unzip it with the `unzip` export from the `@studiometa/playground` NPM package.
