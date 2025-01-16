# v0.2 → v1.0

You will find on this page documentation on all the breaking changes included in the v1.0 of the package.

## Update [@studiometa/js-toolkit](https://github.com/studiometa/js-toolkit) to v3

The v1 of [@studiometa/ui](https://github.com/studiometa/ui) now depends on [@studiometa/js-toolkit](https://github.com/studiometa/js-toolkit) v3. Make sure to consult the [migration guide from v2 to v3](https://js-toolkit.studiometa.dev/guide/migration/v2-to-v3.html) for this package as well, it contains documentation on all the major breaking changes.

```diff
   "dependencies": {
-    "@studiometa/js-toolkit": "^2.12.0"
+    "@studiometa/js-toolkit": "^3.0.0"
   }
```

## Update the options of the `Action` component

The [`Action` component](/components/Action/) has been reworked and its options has changed. The `method` and `selector` have been removed.

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
