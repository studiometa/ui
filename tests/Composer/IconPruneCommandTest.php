<?php

use Studiometa\Ui\Composer\IconPruneCommand;

require_once __DIR__ . '/helpers.php';

/**
 * Create a CommandTester for IconPruneCommand with a stubbed Composer.
 *
 * @param array<string, mixed> $extra
 */
function createPruneCommandTester(array $extra, string $vendorDir): \Symfony\Component\Console\Tester\CommandTester
{
    return createCommandTester(new IconPruneCommand(), $extra, $vendorDir);
}

beforeEach(function () {
    $this->tmpDir = sys_get_temp_dir() . '/ui-prune-cmd-test-' . uniqid();
    mkdir($this->tmpDir . '/templates', 0755, true);
    mkdir($this->tmpDir . '/vendor', 0755, true);
    mkdir($this->tmpDir . '/assets/icons/mdi', 0755, true);
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
    $tester = createPruneCommandTester(
        ['studiometa/ui' => ['icons' => ['enabled' => false]]],
        $this->tmpDir . '/vendor'
    );

    $tester->execute([]);

    expect($tester->getDisplay())->toContain('disabled');
    expect($tester->getStatusCode())->toBe(0);
});

test('it shows no unused icons message when nothing to prune', function () {
    file_put_contents(
        $this->tmpDir . '/templates/page.twig',
        "{{ meta_icon('mdi:home') }}"
    );
    file_put_contents(
        $this->tmpDir . '/assets/icons/mdi/home.svg',
        '<svg>home</svg>' . "\n"
    );

    $tester = createPruneCommandTester(
        ['studiometa/ui' => ['icons' => ['scan' => ['templates']]]],
        $this->tmpDir . '/vendor'
    );

    $tester->execute([]);

    expect($tester->getDisplay())->toContain('No unused icons');
    expect($tester->getStatusCode())->toBe(0);
});

test('it prunes icons not referenced in templates', function () {
    file_put_contents(
        $this->tmpDir . '/templates/page.twig',
        "{{ meta_icon('mdi:home') }}"
    );
    file_put_contents(
        $this->tmpDir . '/assets/icons/mdi/home.svg',
        '<svg>home</svg>' . "\n"
    );
    file_put_contents(
        $this->tmpDir . '/assets/icons/mdi/old-icon.svg',
        '<svg>old</svg>' . "\n"
    );

    $tester = createPruneCommandTester(
        ['studiometa/ui' => ['icons' => ['scan' => ['templates']]]],
        $this->tmpDir . '/vendor'
    );

    $tester->execute([]);

    $output = $tester->getDisplay();
    expect($output)->toContain('Pruned');
    expect($output)->toContain('mdi:old-icon');
    expect(file_exists($this->tmpDir . '/assets/icons/mdi/home.svg'))->toBeTrue();
    expect(file_exists($this->tmpDir . '/assets/icons/mdi/old-icon.svg'))->toBeFalse();
});

test('it keeps manually included icons during prune', function () {
    // No templates reference mdi:loading, but it's in the include list
    file_put_contents(
        $this->tmpDir . '/assets/icons/mdi/loading.svg',
        '<svg>loading</svg>' . "\n"
    );
    file_put_contents(
        $this->tmpDir . '/assets/icons/mdi/unused.svg',
        '<svg>unused</svg>' . "\n"
    );

    $tester = createPruneCommandTester(
        ['studiometa/ui' => ['icons' => [
            'scan' => ['templates'],
            'include' => ['mdi:loading'],
        ]]],
        $this->tmpDir . '/vendor'
    );

    $tester->execute([]);

    expect(file_exists($this->tmpDir . '/assets/icons/mdi/loading.svg'))->toBeTrue();
    expect(file_exists($this->tmpDir . '/assets/icons/mdi/unused.svg'))->toBeFalse();
});
