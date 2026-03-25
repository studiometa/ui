<?php

use Studiometa\Ui\TwigFunctions\Icon;
use Twig\Environment;
use Twig\Loader\ArrayLoader;

require_once __DIR__ . '/helpers.php';

beforeAll(function () {
    ensureMockApiServer();
});



beforeEach(function () {
    $this->tmpDir = sys_get_temp_dir() . '/ui-icon-debug-test-' . uniqid();
    mkdir($this->tmpDir, 0755, true);
});

afterEach(function () {
    if (is_dir($this->tmpDir)) {
        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($this->tmpDir, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );
        foreach ($files as $file) {
            $file->isDir() ? rmdir($file->getRealPath()) : unlink($file->getRealPath());
        }
        rmdir($this->tmpDir);
    }
});

test('it fetches icons on-the-fly in debug mode and saves them locally', function () {
    $icon = new Icon();
    $icon->setIconPath($this->tmpDir);
    $icon->setApiUrl(getMockApiUrl());

    $env = new Environment(new ArrayLoader([]), ['debug' => true]);
    $result = $icon->run($env, 'mdi:home');

    // Should return SVG content
    expect($result)->toContain('<svg');
    expect($result)->toContain('</svg>');
    expect($result)->toContain('M10 20v-6h4v6h5v-8h3L12 3');

    // Should have saved the file locally
    $localFile = $this->tmpDir . '/mdi/home.svg';
    expect(file_exists($localFile))->toBeTrue();
});

test('it serves from local file on second request after debug fetch', function () {
    $icon = new Icon();
    $icon->setIconPath($this->tmpDir);
    $icon->setApiUrl(getMockApiUrl());

    $env = new Environment(new ArrayLoader([]), ['debug' => true]);

    // First request: fetches from API
    $result1 = $icon->run($env, 'mdi:alert');
    expect($result1)->toContain('<svg');

    // Second request: should read from local file (no API needed)
    $icon2 = new Icon();
    $icon2->setIconPath($this->tmpDir);
    $result2 = $icon2->run($env, 'mdi:alert');
    expect($result2)->toContain('<svg');
    expect($result2)->toBe($result1);
});

test('it does not fetch on-the-fly when debug mode is off', function () {
    $icon = new Icon();
    $icon->setIconPath($this->tmpDir);
    $icon->setApiUrl(getMockApiUrl());

    $env = new Environment(new ArrayLoader([]), ['debug' => false]);
    $result = $icon->run($env, 'mdi:star');

    // In production mode without local file or iconify/json, returns empty
    // (iconify/json IS installed in dev, so it will fall back to that)
    // The key check is that no file was saved locally
    $localFile = $this->tmpDir . '/mdi/star.svg';
    expect(file_exists($localFile))->toBeFalse();
});

test('it does not save a file when the icon is not found on the API', function () {
    $icon = new Icon();
    $icon->setIconPath($this->tmpDir);
    $icon->setApiUrl(getMockApiUrl());

    $env = new Environment(new ArrayLoader([]), ['debug' => true]);

    // The mock API doesn't know this icon, so fetch returns nothing
    $icon->run($env, 'mdi:nonexistent-icon-xyz');

    $localFile = $this->tmpDir . '/mdi/nonexistent-icon-xyz.svg';
    expect(file_exists($localFile))->toBeFalse();
});
