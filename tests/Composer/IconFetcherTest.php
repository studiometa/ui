<?php

use Studiometa\Ui\Composer\IconFetcher;

test('it fetches icons from the Iconify API', function () {
    $fetcher = new IconFetcher();
    $result = $fetcher->fetch(['mdi:home']);

    expect($result)->toHaveKey('mdi:home');
    expect($result['mdi:home'])->toContain('<svg');
    expect($result['mdi:home'])->toContain('</svg>');
    expect($result['mdi:home'])->toContain('viewBox');
});

test('it fetches multiple icons in a single batch', function () {
    $fetcher = new IconFetcher();
    $result = $fetcher->fetch(['mdi:home', 'mdi:alert', 'mdi:arrow-right']);

    expect($result)->toHaveCount(3);
    expect($result)->toHaveKeys(['mdi:home', 'mdi:alert', 'mdi:arrow-right']);
});

test('it groups icons by prefix and fetches efficiently', function () {
    $fetcher = new IconFetcher();
    $result = $fetcher->fetch(['mdi:home', 'heroicons:chevron-down']);

    expect($result)->toHaveCount(2);
    expect($result)->toHaveKey('mdi:home');
    expect($result)->toHaveKey('heroicons:chevron-down');
});

test('it handles non-existent icons gracefully', function () {
    $fetcher = new IconFetcher();
    $result = $fetcher->fetch(['mdi:this-icon-does-not-exist-12345']);

    expect($result)->not->toHaveKey('mdi:this-icon-does-not-exist-12345');
});

test('it generates valid SVG output', function () {
    $fetcher = new IconFetcher();
    $result = $fetcher->fetch(['mdi:alert']);

    $svg = $result['mdi:alert'];

    // Should have proper SVG structure
    expect($svg)->toStartWith('<svg');
    expect($svg)->toContain('xmlns="http://www.w3.org/2000/svg"');
    expect($svg)->toContain('preserveAspectRatio="xMidYMid meet"');
    expect($svg)->toEndWith('</svg>');
});
