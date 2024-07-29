# v0.2 → v1.0

You will find on this page documentation on all the breaking changes included in the v1.0 of the package.

## Update [@studiometa/js-toolkit](https://github.com/studiometa/js-toolkit) to v3

The v1 of [@studiometa/ui](https://github.com/studiometa/ui) now depends on [@studiometa/js-toolkit](https://github.com/studiometa/js-toolkit) v3.

```diff
   "dependencies": {
-    "@studiometa/js-toolkit": "^2.12.0"
+    "@studiometa/js-toolkit": "^3.0.0"
   }
```

::: warning Prereleases
At the time of writing (07/2024), both packages are still in their alpha stage, you will need to use the `next` tag to install them:

```bash
npm i @studiometa/js-toolkit@next @studiometa/ui@next
```

:::

## Update the options of the `Action` component

The [`Action` component](/components/atoms/Action/) has been reworked and its options has changed. The `method` and `selector` have been removed.

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
