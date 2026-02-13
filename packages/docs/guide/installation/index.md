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

The package is a Composer plugin that automatically fetches icons from the [Iconify API](https://iconify.design/) when you run `composer install` or `composer update`. You will need to allow the plugin:

```bash
composer config allow-plugins.studiometa/ui true
```

### Icon management

Icons referenced via `meta_icon('collection:icon-name')` in your templates are automatically scanned and fetched as local SVG files. You can also manage icons manually:

```bash
# Scan templates and fetch missing icons
composer ui:icons

# Preview detected icons without fetching (dry-run)
composer ui:icons --dry-run

# Fetch and remove unused icons
composer ui:icons --prune

# Remove unused icons only
composer ui:icons:prune
```

You can configure the icon behavior in your project's `composer.json`:

```json
{
    "extra": {
        "studiometa/ui": {
            "icons": {
                "enabled": true,
                "output": "assets/icons",
                "scan": ["templates", "app"],
                "include": ["mdi:loading"],
                "exclude": ["mdi:test-*"]
            }
        }
    }
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | `true` | Enable/disable automatic icon syncing |
| `output` | `"assets/icons"` | Directory for local SVG files |
| `scan` | `["templates"]` | Directories to scan for `meta_icon()` calls |
| `include` | `[]` | Icons to always fetch (even if not found in templates) |
| `exclude` | `[]` | Glob patterns for icons to ignore |

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
