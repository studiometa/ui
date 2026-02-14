<?php

/**
 * Mock Iconify API server for testing.
 *
 * Serves JSON responses that mimic the Iconify API format.
 * Usage: php -S localhost:PORT tests/Composer/fixtures/mock-api.php
 */

$uri = $_SERVER['REQUEST_URI'];

// Parse: /{prefix}.json?icons=name1,name2
if (preg_match('#^/([a-zA-Z0-9_-]+)\.json#', $uri, $matches)) {
    $prefix = $matches[1];
    $icons = isset($_GET['icons']) ? explode(',', $_GET['icons']) : [];

    header('Content-Type: application/json');

    $response = [
        'prefix' => $prefix,
        'width' => 24,
        'height' => 24,
        'icons' => [],
    ];

    // Known mock icons
    $mockIcons = [
        'mdi' => [
            'home' => '<path d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8z"/>',
            'alert' => '<path d="M13 14h-2V9h2m0 9h-2v-2h2M1 21h22L12 2L1 21z"/>',
            'arrow-right' => '<path d="M4 11v2h12l-5.5 5.5l1.42 1.42L19.84 12l-7.92-7.92L10.5 5.5L16 11H4z"/>',
            'star' => '<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21z"/>',
        ],
        'heroicons' => [
            'chevron-down' => '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m19.5 8.25l-7.5 7.5l-7.5-7.5"/>',
        ],
    ];

    foreach ($icons as $name) {
        if (isset($mockIcons[$prefix][$name])) {
            $response['icons'][$name] = [
                'body' => $mockIcons[$prefix][$name],
            ];
        }
    }

    echo json_encode($response);
    return true;
}

http_response_code(404);
echo '{"error": "not found"}';
return true;
