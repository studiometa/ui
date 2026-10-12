---
outline: deep
---

# Contributing

## Branching

The [repository](https://github.com/studiometa/ui) for `@studiometa/ui` follows a trunk-based workflow with `main` as the single principal branch:

- `feature/...` for new features
- `fix/...` for bug fixes

Every merge should be first approved by opening a pull-request against the `main` branch.

## Local development

Clone the project and install the required dependencies. The back-end can be run with [ddev](https://github.com/drud/ddev) which is preconfigured.

```bash
git clone https://github.com:studiometa/ui.git
cd ui/

# Install NPM dependencies
npm install
ddev start

# Launch the dev environment
npm run docs:dev
```

You will then be able to open the documentation development URL [localhost:5173/-/](http://localhost:5173/-/) in your browser.

The TypeScript files from the `@studiometa/ui` packages can be imported in the playground by using a ESM import statement:

```js
import { Figure } from '@studiometa/ui';
```

While in dev mode, the source TypeScript files will be automatically rebuild on change and made available to the playground at [localhost:5173/-/play/index.html](http://localhost:5173/-/play/index.html).

You can also [open the repository in GitPod](https://gitpod.io/#https://github.com/studiometa/ui) and start the dev environment there.

### Remote development with Gitpod

The repository is also configured to easily run in [Gitpod](https://gitpod.io). Just click on the following button to get started:

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/studiometa/ui)

## Adding a component

A component can either be a single TypeScript file, a single Twig template or for more complex features, a combination of both.

::: tip 💡 Pro tip
Take inspiration from existing components for new implementations.
:::

### TypeScript

The default template for a TypeScript component is as follow:

```ts
import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';

export interface NameProps extends BaseProps {}

/**
 * Name class.
 */
export default class Name extends Base<NameProps> {
  static config: BaseConfig = {
    name: 'Name',
  };
}
```

Once your component is ready, export its public content from the family `index.ts` file and from `packages/ui/index.ts`. Add or update its entry in the documentation reference catalog so its symbols, package, surfaces and lifecycle status remain discoverable:

```diff
 export * from './Modal/index.js';
+export * from './MyComponent/index.js';
 export * from './Panel/index.js';
```

### Twig

All Twig templates should at least expose an `attr` variable that can be used to configure the attributes of the HTML root element of the template. To facilitate this pattern, we use functions added by our [studiometa/twig-toolkit](https://github.com/studiometa/twig-toolkit).

```twig
{% set default_attributes = { class: 'block' } %}
{% set required_attributes = { data_component: 'MyComponent' } %}

{% set attributes = merge_html_attributes(
  attr ?? null,
  default_attributes,
  required_attributes,
) %}

<div {{ html_attributes(attribute) }}>
  ...
</div>
```

## Changelog

Do not edit the `CHANGELOG.md` file. Each pull-request adds a fragment in `.changelog/<slug>.md`, where the slug is the branch name without its prefix (`feature/my-component` → `my-component.md`). A fragment only contains [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) `###` sections followed by their entries:

```md
### Added

- **MyComponent:** add the `MyComponent` component

### Fixed

- **Fetch:** fix the history update after a form submit
```

Do not write the pull-request number: the release adds it. A pull-request that changes a published package needs a fragment, unless it has the `no-changelog` label (tests, docs, refactors, tooling). See [weareikko/changelog](https://github.com/weareikko/changelog) for the format.

## Publishing a new version

Run the `release` workflow from the branch to release, in the [Actions tab](https://github.com/studiometa/ui/actions/workflows/publish.yml) or with the GitHub CLI:

```sh
gh workflow run publish.yml --ref main -f version=patch
```

The `version` input accepts `patch`, `minor`, `major` or an exact version such as `1.12.0-beta.0`. The workflow updates the version number of all packages and of `composer.json`, folds the `.changelog/` fragments into `CHANGELOG.md`, commits and tags the release, publishes the `@studiometa/ui` packages to NPM (with the `next` tag for alpha, beta and rc versions) and creates a release on GitHub. The [Packagist package](https://packagist.org/packages/studiometa/ui) will be updated with the latest tag as well.
