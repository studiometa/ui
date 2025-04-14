# v0.2 → v1.0

You will find on this page documentation on all the breaking changes included in the v1.0 of the package.

[[toc]]

## Update [@studiometa/js-toolkit](https://github.com/studiometa/js-toolkit) to v3

The v1 of [@studiometa/ui](https://github.com/studiometa/ui) now depends on [@studiometa/js-toolkit](https://github.com/studiometa/js-toolkit) v3. Make sure to consult the [migration guide from v2 to v3](https://js-toolkit.studiometa.dev/guide/migration/v2-to-v3.html) for this package as well, it contains documentation on all the major breaking changes.

```diff
   "dependencies": {
-    "@studiometa/js-toolkit": "^2.12.0"
+    "@studiometa/js-toolkit": "^3.0.0"
   }
```

## Update the options of the `Action` component

The [`Action` component](/components/Action/) has been reworked and its options has changed. The `method` and `selector` options have been removed.

```diff
  <button
    data-component="Action"
-   data-option-target="Foo"
-   data-option-selector=".foo"
-   data-option-method="bar"
+   data-option-target="Foo(.foo)"
+   data-option-effect="target.bar()"
    type="button">
    Click me
  </button>
```

## Update include paths in Twig

The atomic folders `primitives`, `atoms`, `molecules` and `organisms` have been removed (see [#343](https://github.com/studiometa/ui/pull/343)). This has no impact for JavaScript imports, but `{% include %}`, `{% embed %}` and `{% extend %}` paths must be updated in Twig files.

```diff
- {% include '@ui/atoms/Button/Button.twig' with { label: 'Button' } %}
+ {% include '@ui/Button/Button.twig' with { label: 'Button' } %}
```

## The `IconInline.twig` template has been renamed to `Icon.twig`

The deprecated `Icon/Icon.twig` template has been replaced with the new `Icon/IconInline.twig` template. Its variant `Icon/IconInlineImg.twig` has been renamed `Icon/IconImg.twig`.

```diff
- {% include '@ui/atoms/Icon/IconInline.twig' with { name: 'globe' } %}
+ {% include '@ui/Icon/Icon.twig' with { name: 'globe' } %}

- {% include '@ui/atoms/Icon/IconInlineImg.twig' with { name: 'globe' } %}
+ {% include '@ui/Icon/IconImg.twig' with { name: 'globe' } %}
```

## Minimum requirements for Composer have been upgraded

As we upgraded the [studiometa/twig-toolkit](https://github.com/studiometa/twig-toolkit) dependency to ^2.0, the Composer package [studiometa/ui](https://packagist.org/packages/studiometa/ui) now has the following minimum requirements:

- php: ^8.1
- [twig/twig](https://github.com/twigphp/Twig): ^3.0

## The `TableOfContent` component has been removed

The `TableOfContent` component has been deprecated for a while, it is removed in v1. The [AnchorNav component](/components/AnchorNav/) can be used as a replacement.
