<?php

use Studiometa\Ui\Composer\Config;

require_once __DIR__ . '/helpers.php';

test('it uses default values when no extra config is set', function () {
    $composer = createComposerStub();
    $config = new Config($composer);

    expect($config->isEnabled())->toBeTrue();
    expect($config->getOutputDir())->toEndWith('/assets/icons');
    expect($config->getScanDirs())->toHaveCount(1);
    expect($config->getScanDirs()[0])->toEndWith('/templates');
    expect($config->getIncludedIcons())->toBe([]);
    expect($config->getExcludedPatterns())->toBe([]);
    expect($config->getApiUrl())->toBe('https://api.iconify.design');
});

test('it reads custom config from extra', function () {
    $composer = createComposerStub([
        'studiometa/ui' => [
            'icons' => [
                'enabled' => false,
                'output' => 'build/icons',
                'scan' => ['tpl', 'views'],
                'include' => ['mdi:loading'],
                'exclude' => ['mdi:test-*'],
                'api' => 'https://custom-api.example.com/',
            ],
        ],
    ]);
    $config = new Config($composer);

    expect($config->isEnabled())->toBeFalse();
    expect($config->getOutputDir())->toEndWith('/build/icons');
    expect($config->getScanDirs())->toHaveCount(2);
    expect($config->getIncludedIcons())->toBe(['mdi:loading']);
    expect($config->getExcludedPatterns())->toBe(['mdi:test-*']);
    expect($config->getApiUrl())->toBe('https://custom-api.example.com');
});

test('it resolves relative paths against project dir', function () {
    $composer = createComposerStub(
        ['studiometa/ui' => ['icons' => ['output' => 'my-icons', 'scan' => ['tpl']]]],
        '/home/user/project/vendor'
    );
    $config = new Config($composer);

    expect($config->getOutputDir())->toBe('/home/user/project/my-icons');
    expect($config->getScanDirs())->toBe(['/home/user/project/tpl']);
    expect($config->getProjectDir())->toBe('/home/user/project');
});

test('it preserves absolute paths', function () {
    $composer = createComposerStub([
        'studiometa/ui' => [
            'icons' => [
                'output' => '/absolute/icons',
                'scan' => ['/absolute/templates'],
            ],
        ],
    ]);
    $config = new Config($composer);

    expect($config->getOutputDir())->toBe('/absolute/icons');
    expect($config->getScanDirs())->toBe(['/absolute/templates']);
});

test('it handles empty studiometa/ui extra gracefully', function () {
    $composer = createComposerStub(['studiometa/ui' => []]);
    $config = new Config($composer);

    expect($config->isEnabled())->toBeTrue();
    expect($config->getIncludedIcons())->toBe([]);
});

test('it handles non-array studiometa/ui extra gracefully', function () {
    $composer = createComposerStub(['studiometa/ui' => 'invalid']);
    $config = new Config($composer);

    expect($config->isEnabled())->toBeTrue();
});

test('it trims trailing slash from API URL', function () {
    $composer = createComposerStub([
        'studiometa/ui' => [
            'icons' => ['api' => 'https://api.example.com///'],
        ],
    ]);
    $config = new Config($composer);

    expect($config->getApiUrl())->toBe('https://api.example.com');
});
