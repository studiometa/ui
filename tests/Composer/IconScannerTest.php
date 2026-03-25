<?php

use Studiometa\Ui\Composer\IconScanner;

beforeEach(function () {
    $this->tmpDir = sys_get_temp_dir() . '/ui-scanner-test-' . uniqid();
    mkdir($this->tmpDir, 0755, true);
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

test('it scans twig files for meta_icon calls', function () {
    file_put_contents($this->tmpDir . '/template.twig', "{{ meta_icon('mdi:home') }}");

    $scanner = new IconScanner();
    $icons = $scanner->scan([$this->tmpDir]);

    expect($icons)->toBe(['mdi:home']);
});

test('it scans multiple files and deduplicates', function () {
    file_put_contents($this->tmpDir . '/a.twig', "{{ meta_icon('mdi:home') }} {{ meta_icon('mdi:alert') }}");
    file_put_contents($this->tmpDir . '/b.twig', "{{ meta_icon('mdi:home') }} {{ meta_icon('heroicons:chevron-down') }}");

    $scanner = new IconScanner();
    $icons = $scanner->scan([$this->tmpDir]);

    expect($icons)->toBe(['heroicons:chevron-down', 'mdi:alert', 'mdi:home']);
});

test('it handles double-quoted strings', function () {
    file_put_contents($this->tmpDir . '/template.twig', '{{ meta_icon("mdi:arrow-right") }}');

    $scanner = new IconScanner();
    $icons = $scanner->scan([$this->tmpDir]);

    expect($icons)->toBe(['mdi:arrow-right']);
});

test('it scans PHP files', function () {
    file_put_contents($this->tmpDir . '/template.php', "<?php echo meta_icon('mdi:star'); ?>");

    $scanner = new IconScanner();
    $icons = $scanner->scan([$this->tmpDir]);

    expect($icons)->toBe(['mdi:star']);
});

test('it scans subdirectories recursively', function () {
    mkdir($this->tmpDir . '/sub/deep', 0755, true);
    file_put_contents($this->tmpDir . '/sub/deep/template.twig', "{{ meta_icon('mdi:search') }}");

    $scanner = new IconScanner();
    $icons = $scanner->scan([$this->tmpDir]);

    expect($icons)->toBe(['mdi:search']);
});

test('it excludes icons matching patterns', function () {
    file_put_contents($this->tmpDir . '/template.twig', "{{ meta_icon('mdi:home') }} {{ meta_icon('mdi:test-icon') }}");

    $scanner = new IconScanner();
    $icons = $scanner->scan([$this->tmpDir], ['mdi:test-*']);

    expect($icons)->toBe(['mdi:home']);
});

test('it returns empty array for non-existent directory', function () {
    $scanner = new IconScanner();
    $icons = $scanner->scan(['/non/existent/path']);

    expect($icons)->toBe([]);
});

test('it returns empty array for files without meta_icon calls', function () {
    file_put_contents($this->tmpDir . '/template.twig', '<div>No icons here</div>');

    $scanner = new IconScanner();
    $icons = $scanner->scan([$this->tmpDir]);

    expect($icons)->toBe([]);
});
