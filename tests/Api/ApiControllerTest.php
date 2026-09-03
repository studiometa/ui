<?php

/*
 * The API app is a standalone Symfony project with its own `composer.json`, and its
 * dependencies are not installed for this test suite, so the controller cannot be
 * loaded or booted here. The routes it declares are still asserted statically, which
 * is enough to catch the reintroduction of the removed `/source` endpoint: that
 * endpoint concatenated an unvalidated `?path=` query parameter onto a base directory
 * and returned the file it landed on, so a `../` payload read arbitrary files.
 */

$controllerPath = realpath(__DIR__ . '/../../packages/api/src/Controller/ApiController.php');

$controllerSource = function () use ($controllerPath): string {
    expect($controllerPath)->toBeString();

    return (string) file_get_contents($controllerPath);
};

test('the API controller only routes the template rendering endpoint', function () use ($controllerSource) {
    preg_match_all("/#\[Route\(\s*'([^']*)'/", $controllerSource(), $matches);

    expect($matches[1])->toBe(['/']);
});

test('the API controller no longer exposes the file source endpoint', function () use ($controllerSource) {
    $source = $controllerSource();

    expect($source)->not->toContain("'/source'");
    expect($source)->not->toContain('api-source');
    expect($source)->not->toMatch('/function\s+source\s*\(/');
});

test('the API controller never reads a file from a request supplied path', function () use ($controllerSource) {
    $source = $controllerSource();

    foreach (['file_get_contents', 'file_exists', 'readfile', 'fopen', 'glob', 'scandir', '__DIR__'] as $needle) {
        expect($source)->not->toContain($needle);
    }
});
