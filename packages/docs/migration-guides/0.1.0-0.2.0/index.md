# v0.1.0 → v0.2.0

## Review the component updates

The following components have been updated:

| Component                                               | Previous version                  | New version            | Changed                             |
| ------------------------------------------------------- | --------------------------------- | ---------------------- | ----------------------------------- |
| [Button](/reference/items/Button/)                      | <Badge type="grey" text="0.0.0"/> | <Badge text="0.1.0" /> | • Twig Template API standardization |
| [Cursor](/reference/items/Cursor/)                      | <Badge type="grey" text="0.0.0"/> | <Badge text="0.1.0" /> | • Twig Template API standardization |
| [Figure](/reference/items/Figure/)                      | <Badge type="grey" text="0.0.0"/> | <Badge text="0.1.0" /> | • Twig Template API standardization |
| Accordion <Badge type="warning" text="removed in v2" /> | <Badge type="grey" text="0.0.0"/> | <Badge text="0.1.0" /> | • Twig Template API standardization |
| Modal <Badge type="warning" text="removed in v2" />     | <Badge type="grey" text="0.0.0"/> | <Badge text="0.1.0" /> | • Twig Template API standardization |
| [Sticky](/reference/items/Sticky/)                      | <Badge type="grey" text="0.0.0"/> | <Badge text="0.1.0" /> | • Twig Template API standardization |

## Install the Twig extension

A Composer package has been added to easily setup the [`studiometa/twig-toolkit` Twig extension](https://github.com/studiometa/twig-toolkit) and the required namespaces for this project. This packages extends the `studiometa/twig-toolkit` extension, so you can safely replace it with `studiometa/ui` in your project's `composer.json` file.

```bash
composer remove studiometa/twig-toolkit
composer require studiometa/ui
```

## Include Twig template

Before this release, the Twig templates were not ready for inclusion in your project. This is now possible for the following components:

- [Button](/reference/items/Button/)
- [Cursor](/reference/items/Cursor/)
- [Figure](/reference/items/Figure/)
- Accordion <Badge type="warning" text="removed in v2" />
- Modal <Badge type="warning" text="removed in v2" />
- [Sticky](/reference/items/Sticky/)

These components have seen their version number increased from `0.0.0` to `0.1.0` to indicate this change.
