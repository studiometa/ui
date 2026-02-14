<?php

use Composer\IO\BufferIO;
use Composer\Script\Event;
use Composer\Script\ScriptEvents;
use Studiometa\Ui\Composer\Plugin;

require_once __DIR__ . '/helpers.php';

/**
 * Build the icons extra config with the mock API URL injected.
 *
 * @param array<string, mixed> $iconsConfig
 * @return array<string, mixed>
 */
function pluginExtra(array $iconsConfig): array
{
    return ['studiometa/ui' => ['icons' => array_merge(['api' => getMockApiUrl()], $iconsConfig)]];
}

beforeAll(function () {
    ensureMockApiServer();
});

beforeEach(function () {
    $this->tmpDir = sys_get_temp_dir() . '/ui-plugin-test-' . uniqid();
    mkdir($this->tmpDir . '/templates', 0755, true);
    mkdir($this->tmpDir . '/vendor', 0755, true);
});

afterEach(function () {
    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($this->tmpDir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($files as $file) {
        $file->isDir() ? rmdir($file->getRealPath()) : unlink($file->getRealPath());
    }
    rmdir($this->tmpDir);
});

test('it subscribes to post-install and post-update events', function () {
    $events = Plugin::getSubscribedEvents();

    expect($events)->toHaveKey(ScriptEvents::POST_INSTALL_CMD);
    expect($events)->toHaveKey(ScriptEvents::POST_UPDATE_CMD);
    expect($events[ScriptEvents::POST_INSTALL_CMD])->toBe('syncIcons');
    expect($events[ScriptEvents::POST_UPDATE_CMD])->toBe('syncIcons');
});

test('it does nothing when disabled', function () {
    $composer = createComposerStub(
        pluginExtra(['enabled' => false]),
        $this->tmpDir . '/vendor'
    );
    $io = new BufferIO();

    $plugin = new Plugin();
    $plugin->activate($composer, $io);

    $event = new Event(ScriptEvents::POST_INSTALL_CMD, $composer, $io);
    $plugin->syncIcons($event);

    expect($io->getOutput())->toBe('');
});

test('it reports no icons found when templates are empty', function () {
    $composer = createComposerStub(
        pluginExtra(['scan' => ['templates']]),
        $this->tmpDir . '/vendor'
    );
    $io = new BufferIO();

    $plugin = new Plugin();
    $plugin->activate($composer, $io);

    $event = new Event(ScriptEvents::POST_INSTALL_CMD, $composer, $io);
    $plugin->syncIcons($event);

    expect($io->getOutput())->toContain('No icons found');
});

test('it reports all icons up to date when already synced', function () {
    file_put_contents(
        $this->tmpDir . '/templates/page.twig',
        "{{ meta_icon('mdi:home') }}"
    );
    mkdir($this->tmpDir . '/assets/icons/mdi', 0755, true);
    file_put_contents(
        $this->tmpDir . '/assets/icons/mdi/home.svg',
        '<svg>home</svg>' . "\n"
    );

    $composer = createComposerStub(
        pluginExtra(['scan' => ['templates']]),
        $this->tmpDir . '/vendor'
    );
    $io = new BufferIO();

    $plugin = new Plugin();
    $plugin->activate($composer, $io);

    $event = new Event(ScriptEvents::POST_INSTALL_CMD, $composer, $io);
    $plugin->syncIcons($event);

    expect($io->getOutput())->toContain('up to date');
});

test('it fetches new icons on sync', function () {
    file_put_contents(
        $this->tmpDir . '/templates/page.twig',
        "{{ meta_icon('mdi:home') }}"
    );

    $composer = createComposerStub(
        pluginExtra(['scan' => ['templates']]),
        $this->tmpDir . '/vendor'
    );
    $io = new BufferIO();

    $plugin = new Plugin();
    $plugin->activate($composer, $io);

    $event = new Event(ScriptEvents::POST_INSTALL_CMD, $composer, $io);
    $plugin->syncIcons($event);

    $output = $io->getOutput();
    expect($output)->toContain('Fetching');
    expect($output)->toContain('Saved');
    expect(file_exists($this->tmpDir . '/assets/icons/mdi/home.svg'))->toBeTrue();
});

test('it reports capabilities including command provider', function () {
    $plugin = new Plugin();
    $capabilities = $plugin->getCapabilities();

    expect($capabilities)->toHaveKey('Composer\Plugin\Capability\CommandProvider');
});
