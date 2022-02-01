# v0.1.0 → v0.2.0

## Review the component updates

The following components have been updated:

|                   Component                   |          Previous version         |      New version       |              Changed              |
|-----------------------------------------------|-----------------------------------|------------------------|-----------------------------------|
| [Button](/components/atoms/Button/)           | <Badge type="grey" text="0.0.0"/> | <Badge text="0.1.0" /> | • Twig Template API standardization |
| [Cursor](/components/atoms/Cursor/)           | <Badge type="grey" text="0.0.0"/> | <Badge text="0.1.0" /> | • Twig Template API standardization |
| [Figure](/components/atoms/Figure/)           | <Badge type="grey" text="0.0.0"/> | <Badge text="0.1.0" /> | • Twig Template API standardization |
| [Accordion](/components/molecules/Accordion/) | <Badge type="grey" text="0.0.0"/> | <Badge text="0.1.0" /> | • Twig Template API standardization |
| [Modal](/components/molecules/Modal/)         | <Badge type="grey" text="0.0.0"/> | <Badge text="0.1.0" /> | • Twig Template API standardization |
| [Figure](/components/molecules/Figure/)       | <Badge type="grey" text="0.0.0"/> | <Badge text="0.1.0" /> | • Twig Template API standardization |

## Install the Twig extension

A Composer package has been added to easily setup the [`studiometa/twig-toolkit` Twig extension](https://github.com/studiometa/twig-toolkit) and the required namespaces for this project. This packages extends the `studiometa/twig-toolkit` extension, so you can safely replace it with `studiometa/ui` in your project's `composer.json` file.

```sh
composer remove studiometa/twig-toolkit
composer require studiometa/ui
```

## Include Twig template

Before this release, the Twig templates were not ready for inclusion in your project. This is now possible for the following components:

- [Button](/components/atoms/Button/)
- [Cursor](/components/atoms/Cursor/)
- [Figure](/components/atoms/Figure/)
- [Accordion](/components/molecules/Accordion/)
- [Modal](/components/molecules/Modal/)
- [Figure](/components/molecules/Figure/)

These components have seen their version number increased from `0.0.0` to `0.1.0` to indicate this change.
