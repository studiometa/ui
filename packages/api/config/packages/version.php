<?php

declare(strict_types=1);

use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;

/**
 * Expose the package version as `%app.version%`.
 *
 * It is read from `package.json` rather than written here, because
 * `npm version --workspaces` already maintains that file on every release. A
 * second copy would be a second thing to remember, and the one that is
 * forgotten is the one nobody reads until a client reports the wrong version.
 *
 * The value is resolved when the container compiles, so the running app never
 * touches the filesystem for it.
 */
return static function (ContainerConfigurator $container): void {
    $manifest = json_decode(
        file_get_contents(__DIR__ . '/../../package.json'),
        true,
        512,
        JSON_THROW_ON_ERROR,
    );

    $container->parameters()->set('app.version', $manifest['version']);
};
