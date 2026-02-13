<?php

use Studiometa\Ui\Composer\IconStorage;

beforeEach(function () {
    $this->tmpDir = sys_get_temp_dir() . '/ui-storage-test-' . uniqid();
    mkdir($this->tmpDir, 0755, true);
    $this->storage = new IconStorage($this->tmpDir);
});

afterEach(function () {
    // Clean up temp directory
    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($this->tmpDir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($files as $file) {
        $file->isDir() ? rmdir($file->getRealPath()) : unlink($file->getRealPath());
    }
    rmdir($this->tmpDir);
});

test('it saves an icon SVG to the correct path', function () {
    $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8z"/></svg>';

    $this->storage->save(['mdi:home' => $svg]);

    $path = $this->tmpDir . '/mdi/home.svg';
    expect(file_exists($path))->toBeTrue();
    expect(trim(file_get_contents($path)))->toBe($svg);
});

test('it saves multiple icons from different prefixes', function () {
    $icons = [
        'mdi:home' => '<svg>home</svg>',
        'mdi:alert' => '<svg>alert</svg>',
        'heroicons:chevron' => '<svg>chevron</svg>',
    ];

    $count = $this->storage->save($icons);

    expect($count)->toBe(3);
    expect(file_exists($this->tmpDir . '/mdi/home.svg'))->toBeTrue();
    expect(file_exists($this->tmpDir . '/mdi/alert.svg'))->toBeTrue();
    expect(file_exists($this->tmpDir . '/heroicons/chevron.svg'))->toBeTrue();
});

test('it checks if an icon exists', function () {
    expect($this->storage->has('mdi:home'))->toBeFalse();

    $this->storage->save(['mdi:home' => '<svg>home</svg>']);

    expect($this->storage->has('mdi:home'))->toBeTrue();
});

test('it reads an icon from disk', function () {
    $this->storage->save(['mdi:home' => '<svg>home</svg>']);

    expect($this->storage->read('mdi:home'))->toBe('<svg>home</svg>');
});

test('it returns null when reading a non-existent icon', function () {
    expect($this->storage->read('mdi:nonexistent'))->toBeNull();
});

test('it lists all stored icons', function () {
    $this->storage->save([
        'mdi:home' => '<svg>home</svg>',
        'mdi:alert' => '<svg>alert</svg>',
        'heroicons:chevron' => '<svg>chevron</svg>',
    ]);

    $list = $this->storage->list();

    expect($list)->toBe(['heroicons:chevron', 'mdi:alert', 'mdi:home']);
});

test('it returns empty list for empty directory', function () {
    expect($this->storage->list())->toBe([]);
});

test('it prunes unused icons', function () {
    $this->storage->save([
        'mdi:home' => '<svg>home</svg>',
        'mdi:alert' => '<svg>alert</svg>',
        'mdi:unused' => '<svg>unused</svg>',
    ]);

    $removed = $this->storage->prune(['mdi:home', 'mdi:alert']);

    expect($removed)->toBe(['mdi:unused']);
    expect($this->storage->has('mdi:home'))->toBeTrue();
    expect($this->storage->has('mdi:alert'))->toBeTrue();
    expect($this->storage->has('mdi:unused'))->toBeFalse();
});

test('it cleans empty directories after pruning', function () {
    $this->storage->save([
        'heroicons:chevron' => '<svg>chevron</svg>',
        'mdi:home' => '<svg>home</svg>',
    ]);

    $this->storage->prune(['mdi:home']);

    expect(is_dir($this->tmpDir . '/heroicons'))->toBeFalse();
    expect(is_dir($this->tmpDir . '/mdi'))->toBeTrue();
});

test('it returns the correct file path', function () {
    $path = $this->storage->getPath('mdi:home');

    expect($path)->toBe($this->tmpDir . '/mdi/home.svg');
});
