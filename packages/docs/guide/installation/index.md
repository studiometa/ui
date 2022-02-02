# Installation

## In a Twig project

Install the JavaScript and Vue parts with NPM:

```bash
npm install @studiometa/ui
```

Install the Twig and PHP parts with Composer:

```bash
composer require studiometa/ui
```

Configure the Twig extension from the `studiometa/ui` package in your project:

- Directly with Twig:

  ```php
  use StudioMeta\Ui\Extension;

  // Get the Twig\Enviromnent instance used by your project
  $twig = get_project_twig_environment();
  // Get the Twig\FilesystemLoader instance used by your project
  $loader = get_project_twig_filesystem_loader();

  // Instantiate the extension
  $extension = new Extension(
    $loader,
    'path/to/project/templates',
    'path/to/project/svgs'
  );

  // Add the extension
  $twig->addExtension($extension);
  ```

- Or via services in a Symfony project:
  ```yaml
  # config/services.yaml
  services:
    # add more service definitions when explicit configuration is needed
    # please note that last definitions always *replace* previous ones
    studiometa.ui_extension:
      class: Studiometa\Ui\Extension
      public: false
      arguments:
        - '@twig.loader'
        - '%kernel.project_dir%/templates'
        - '%kernel.project_dir%/public/assets/svg'
      tags:
        - { name: twig.extension }
  ```

The Twig extension will install the [`studiometa/twig-toolkit` extension](https://github.com/studiometa/twig-toolkit) and add the `@ui` and `@svg` namespaces to the loader.

The `@ui` namespace will try to resolve files first from your project's templates and then from the package templates. The configuration is the same for the `@svg` namespace. This will help you override some templates without having to rewrite them all.

For example, the `Modal.twig` template uses the `Button.twig` template. You do not have to override both templates to use a custom button for the modal, you can simply add a template `atoms/Button/Button.twig` in your project and it will be picked up by the Twig filesystem loader.

::: warning
If you try to extend an existing component to override it, do not use the `@ui` namespace as it will trigger an infinite inclusion loop. Instead, use the `@ui-pkg` namespace which references only the templates from the package.
:::

## In a Vue project

Install the package with NPM:

```bash
npm install @studiometa/ui
```
