---
outline: deep
---

# Contributing

## Git Flow

The [repository](https://github.com/studiometa/ui) for `@studiometa/ui follows the [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/) convention, so branches should be prefixed as follow:

- `feature/...` for new features
- `bugfix/...` for bug fixes
- `release/<version>` for releases
- `hotfix/<version>` for hotfixes

Every merge should be first approved by opening a pull-request against the `develop` branch for features and bugfixes and against the `master` branch for releases and hotfixes.

## Local development

Clone the project and install the required dependencies. The back-end can be run with [ddev](https://github.com/drud/ddev) which is preconfigured.

```bash
git clone https://github.com:studiometa/ui.git
cd ui/

# Install root dependencies
npm install
ddev start

# Launch the dev environment
npm run docs:dev
```

You can also [open the repository in GitPod](https://gitpod.io/#https://github.com/studiometa/ui) and start the dev environment there.

## Adding a component

A component can either be a single TypeScript file, a single Twig template or for more complex features, a combination of both.

::: tip 👍 Good practice
As a general rule, take inspiration from existing components for new implementations.
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

Once your component is ready, add an export of all its content to the `index.ts`
file of its category. For example, if it is a molecule, edit the `packages/ui/molecules/index.ts` file:

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

## Publishing a new version

To publis a new version, create a release branch:

```sh
git flow release start 0.2.41
# or without gitflow
git checkout develop
git pull origin develop
git checkout -b release/0.2.41
```

In this release branch, update the version number of all packages with the following command:

```sh
npm version 0.2.41 -ws --include-workspace-root
```

Edit the `CHANGELOG.md` file to add the version number and the date of the release:

```diff
 ## [Unreleased]

+## [v0.2.41](https://github.com/studiometa/ui/compare/0.2.40..0.2.41) (2024-02-13)
+
```

Open a pull-request to validate the changes and make sure all tests are passing. Once the PR is approved, merge the release:

```sh
git flow release finish
# or with git
git checkout master
git pull origin master
git merge release/0.2.41 --no-ff
git tag 0.2.41 --message 'v0.2.41'
git checkout develop
git merge 0.2.41 --no-ff
```

And push all the changes to GitHub:

```sh
git push origin develop
git push origin master
git push origing --tags
```

GitHub actions will create a release on GitHub and publish the `@studiometa/ui` packages to NPM. The [Packagist package](https://packagist.org/packages/studiometa/ui) will be updated with the latest tag as well.
