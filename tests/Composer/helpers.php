<?php

use Composer\Composer;
use Composer\Config as ComposerConfig;
use Composer\Console\Application as ComposerApplication;
use Composer\EventDispatcher\EventDispatcher;
use Composer\IO\NullIO;
use Composer\Package\RootPackage;
use Symfony\Component\Console\Tester\CommandTester;
use Composer\Command\BaseCommand;

/**
 * Create a stubbed Composer instance for testing.
 *
 * @param array<string, mixed> $extra The "extra" config from composer.json.
 * @param string $vendorDir Absolute path to the vendor directory.
 */
function createComposerStub(array $extra = [], string $vendorDir = '/tmp/test/vendor'): Composer
{
    $composer = new Composer();

    $config = new ComposerConfig(false);
    $config->merge(['config' => ['vendor-dir' => $vendorDir]]);
    $composer->setConfig($config);

    $package = new RootPackage('test/test', '1.0.0.0', '1.0.0');
    $package->setExtra($extra);
    $composer->setPackage($package);

    $composer->setEventDispatcher(new EventDispatcher($composer, new NullIO()));

    return $composer;
}

/**
 * Create a CommandTester for a Composer BaseCommand with a stubbed Composer.
 *
 * @param array<string, mixed> $extra
 */
function createCommandTester(BaseCommand $command, array $extra, string $vendorDir): CommandTester
{
    $composer = createComposerStub($extra, $vendorDir);
    $command->setComposer($composer);

    $app = new ComposerApplication();
    $app->addCommand($command);

    /** @var BaseCommand $registeredCommand */
    $registeredCommand = $app->find($command->getName());

    return new CommandTester($registeredCommand);
}
