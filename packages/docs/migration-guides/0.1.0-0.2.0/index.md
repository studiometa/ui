# v0.1.0 → v0.2.0

## Review the component updates

The following components have been updated:

|                   Component                   |          Previous version         |      New version       |              Changed              |
|-----------------------------------------------|-----------------------------------|------------------------|-----------------------------------|
| [Button](/components/Button/)           | <Badge type="grey" text="0.0.0"/> | <Badge text="0.1.0" /> | • Twig Template API standardization |
| [Cursor](/components/Cursor/)           | <Badge type="grey" text="0.0.0"/> | <Badge text="0.1.0" /> | • Twig Template API standardization |
| [Figure](/components/Figure/)           | <Badge type="grey" text="0.0.0"/> | <Badge text="0.1.0" /> | • Twig Template API standardization |
| [Accordion](/components/Accordion/) | <Badge type="grey" text="0.0.0"/> | <Badge text="0.1.0" /> | • Twig Template API standardization |
| [Modal](/components/Modal/)         | <Badge type="grey" text="0.0.0"/> | <Badge text="0.1.0" /> | • Twig Template API standardization |
| [Sticky](/components/Sticky/)       | <Badge type="grey" text="0.0.0"/> | <Badge text="0.1.0" /> | • Twig Template API standardization |

## Install the Twig extension

A Composer package has been added to easily setup the [`studiometa/twig-toolkit` Twig extension](https://github.com/studiometa/twig-toolkit) and the required namespaces for this project. This packages extends the `studiometa/twig-toolkit` extension, so you can safely replace it with `studiometa/ui` in your project's `composer.json` file.

```bash
composer remove studiometa/twig-toolkit
composer require studiometa/ui
```

## Include Twig template

Before this release, the Twig templates were not ready for inclusion in your project. This is now possible for the following components:

- [Button](/components/Button/)
- [Cursor](/components/Cursor/)
- [Figure](/components/Figure/)
- [Accordion](/components/Accordion/)
- [Modal](/components/Modal/)
- [Sticky](/components/Sticky/)

These components have seen their version number increased from `0.0.0` to `0.1.0` to indicate this change.
