<?php

use Composer\Composer;
use Composer\Config as ComposerConfig;
use Composer\Console\Application as ComposerApplication;
use Composer\EventDispatcher\EventDispatcher;
use Composer\IO\NullIO;
use Composer\Package\RootPackage;
use Symfony\Component\Console\Tester\CommandTester;
use Composer\Command\BaseCommand;

const MOCK_API_PORT = 18923;

/**
 * Start the mock Iconify API server (idempotent).
 */
function ensureMockApiServer(): string
{
    $url = 'http://localhost:' . MOCK_API_PORT;

    // Already running?
    $conn = @fsockopen('localhost', MOCK_API_PORT, $errno, $errstr, 0.1);
    if ($conn) {
        fclose($conn);
        return $url;
    }

    $cmd = sprintf(
        'php -S localhost:%d %s > /dev/null 2>&1 & echo $!',
        MOCK_API_PORT,
        escapeshellarg(__DIR__ . '/fixtures/mock-api.php')
    );
    $pid = (int) trim((string) shell_exec($cmd));
    $GLOBALS['mockApiPid'] = $pid;

    // Wait for server to be ready
    for ($i = 0; $i < 50; $i++) {
        $conn = @fsockopen('localhost', MOCK_API_PORT, $errno, $errstr, 0.1);
        if ($conn) {
            fclose($conn);
            return $url;
        }
        usleep(20_000);
    }

    return $url;
}

/**
 * Stop the mock API server.
 */
function stopMockApiServer(): void
{
    if (isset($GLOBALS['mockApiPid']) && $GLOBALS['mockApiPid'] > 0) {
        posix_kill($GLOBALS['mockApiPid'], SIGTERM);
        unset($GLOBALS['mockApiPid']);
    }
}

/**
 * Get the mock API URL (assumes server is already started).
 */
function getMockApiUrl(): string
{
    return 'http://localhost:' . MOCK_API_PORT;
}

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
