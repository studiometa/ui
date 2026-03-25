<?php

use Studiometa\Ui\Composer\IconSyncCommand;

require_once __DIR__ . '/helpers.php';

/**
 * Create a CommandTester for IconSyncCommand with a stubbed Composer.
 * Automatically injects the mock API URL into the icons config.
 *
 * @param array<string, mixed> $extra
 */
function createSyncCommandTester(array $extra, string $vendorDir): \Symfony\Component\Console\Tester\CommandTester
{
    // Inject mock API URL if icons config exists and no api is set
    if (isset($extra['studiometa/ui']['icons']) && !isset($extra['studiometa/ui']['icons']['api'])) {
        $extra['studiometa/ui']['icons']['api'] = getMockApiUrl();
    }

    return createCommandTester(new IconSyncCommand(), $extra, $vendorDir);
}

beforeAll(function () {
    ensureMockApiServer();
});

beforeEach(function () {
    $this->tmpDir = sys_get_temp_dir() . '/ui-sync-cmd-test-' . uniqid();
    mkdir($this->tmpDir . '/templates', 0755, true);
    mkdir($this->tmpDir . '/vendor', 0755, true);
    mkdir($this->tmpDir . '/assets/icons', 0755, true);
    $this->mockApiUrl = getMockApiUrl();
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

test('it shows disabled message when icons are disabled', function () {
    $tester = createSyncCommandTester(
        ['studiometa/ui' => ['icons' => ['enabled' => false]]],
        $this->tmpDir . '/vendor'
    );

    $tester->execute([]);

    expect($tester->getDisplay())->toContain('disabled');
    expect($tester->getStatusCode())->toBe(0);
});

test('it shows no icons message when templates are empty', function () {
    $tester = createSyncCommandTester(
        ['studiometa/ui' => ['icons' => ['scan' => ['templates']]]],
        $this->tmpDir . '/vendor'
    );

    $tester->execute([]);

    expect($tester->getDisplay())->toContain('No icons found');
    expect($tester->getStatusCode())->toBe(0);
});

test('it lists found icons in dry-run mode', function () {
    file_put_contents(
        $this->tmpDir . '/templates/page.twig',
        "{{ meta_icon('mdi:home') }} {{ meta_icon('mdi:alert') }}"
    );

    $tester = createSyncCommandTester(
        ['studiometa/ui' => ['icons' => ['scan' => ['templates']]]],
        $this->tmpDir . '/vendor'
    );

    $tester->execute(['--dry-run' => true]);

    $output = $tester->getDisplay();
    expect($output)->toContain('2');
    expect($output)->toContain('mdi:home');
    expect($output)->toContain('mdi:alert');
    expect($tester->getStatusCode())->toBe(0);

    // No files should have been created
    expect(file_exists($this->tmpDir . '/assets/icons/mdi/home.svg'))->toBeFalse();
});

test('it fetches and saves icons', function () {
    file_put_contents(
        $this->tmpDir . '/templates/page.twig',
        "{{ meta_icon('mdi:home') }}"
    );

    $tester = createSyncCommandTester(
        ['studiometa/ui' => ['icons' => ['scan' => ['templates']]]],
        $this->tmpDir . '/vendor'
    );

    $tester->execute([]);

    $output = $tester->getDisplay();
    expect($output)->toContain('Fetching');
    expect($output)->toContain('Saved');
    expect(file_exists($this->tmpDir . '/assets/icons/mdi/home.svg'))->toBeTrue();
    expect(file_get_contents($this->tmpDir . '/assets/icons/mdi/home.svg'))->toContain('<svg');
});

test('it reports all icons up to date when nothing to fetch', function () {
    file_put_contents(
        $this->tmpDir . '/templates/page.twig',
        "{{ meta_icon('mdi:home') }}"
    );

    // Pre-populate the icon
    mkdir($this->tmpDir . '/assets/icons/mdi', 0755, true);
    file_put_contents(
        $this->tmpDir . '/assets/icons/mdi/home.svg',
        '<svg xmlns="http://www.w3.org/2000/svg">home</svg>' . "\n"
    );

    $tester = createSyncCommandTester(
        ['studiometa/ui' => ['icons' => ['scan' => ['templates']]]],
        $this->tmpDir . '/vendor'
    );

    $tester->execute([]);

    $output = $tester->getDisplay();
    expect($output)->toContain('up to date');
    expect($tester->getStatusCode())->toBe(0);
});

test('it includes manually specified icons', function () {
    // No templates, but include list has an icon
    $tester = createSyncCommandTester(
        ['studiometa/ui' => ['icons' => [
            'scan' => ['templates'],
            'include' => ['mdi:star'],
        ]]],
        $this->tmpDir . '/vendor'
    );

    $tester->execute([]);

    $output = $tester->getDisplay();
    expect($output)->toContain('mdi:star');
    expect(file_exists($this->tmpDir . '/assets/icons/mdi/star.svg'))->toBeTrue();
});

test('it prunes unused icons with --prune flag', function () {
    file_put_contents(
        $this->tmpDir . '/templates/page.twig',
        "{{ meta_icon('mdi:home') }}"
    );

    // Pre-populate with an extra unused icon
    mkdir($this->tmpDir . '/assets/icons/mdi', 0755, true);
    file_put_contents(
        $this->tmpDir . '/assets/icons/mdi/home.svg',
        '<svg>home</svg>' . "\n"
    );
    file_put_contents(
        $this->tmpDir . '/assets/icons/mdi/unused.svg',
        '<svg>unused</svg>' . "\n"
    );

    $tester = createSyncCommandTester(
        ['studiometa/ui' => ['icons' => ['scan' => ['templates']]]],
        $this->tmpDir . '/vendor'
    );

    $tester->execute(['--prune' => true]);

    $output = $tester->getDisplay();
    expect($output)->toContain('Pruned');
    expect($output)->toContain('mdi:unused');
    expect(file_exists($this->tmpDir . '/assets/icons/mdi/home.svg'))->toBeTrue();
    expect(file_exists($this->tmpDir . '/assets/icons/mdi/unused.svg'))->toBeFalse();
});

test('it handles fetch failures gracefully', function () {
    file_put_contents(
        $this->tmpDir . '/templates/page.twig',
        "{{ meta_icon('nonexistent-prefix-xyz:fake-icon') }}"
    );

    $tester = createSyncCommandTester(
        ['studiometa/ui' => ['icons' => ['scan' => ['templates']]]],
        $this->tmpDir . '/vendor'
    );

    $tester->execute([]);

    $output = $tester->getDisplay();
    expect($output)->toContain('Failed to fetch');
    expect($tester->getStatusCode())->toBe(0);
});
