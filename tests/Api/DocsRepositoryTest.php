<?php

use App\Mcp\DocsRepository;
use App\Mcp\Tool\ConceptTools;

require_once __DIR__ . '/../../packages/api/src/Mcp/DocsRepository.php';
require_once __DIR__ . '/../../packages/api/src/Mcp/Tool/ConceptTools.php';

$createRepository = fn (): DocsRepository => new DocsRepository(
    __DIR__ . '/fixtures/docs-dist'
);

test('it lists concepts with canonical paths', function () use ($createRepository) {
    expect($createRepository()->listConcepts())->toBe([
        [
            'name' => 'Concepts',
            'slug' => 'index',
            'path' => '/guide/concepts/',
        ],
        [
            'name' => 'Composition',
            'slug' => 'composition',
            'path' => '/guide/concepts/composition',
        ],
    ]);
});

test('it resolves the concepts overview', function () use ($createRepository) {
    expect($createRepository()->getConcept('Concepts'))->toBe(
        "# Concepts\n\nOverview documentation."
    );
});

test('it resolves a concept by slug or case-insensitive name', function () use ($createRepository) {
    $repository = $createRepository();

    expect($repository->getConcept('composition'))->toBe(
        "# Composition\n\nComposition documentation."
    );
    expect($repository->resolveConceptSlug('COMPOSITION'))->toBe('composition');
});

test('it rejects an unknown concept', function () use ($createRepository) {
    expect(fn () => $createRepository()->getConcept('unknown'))->toThrow(
        RuntimeException::class,
        'Unknown concept "unknown".'
    );
});

test('the MCP tools expose the concept repository', function () use ($createRepository) {
    $tools = new ConceptTools($createRepository());

    expect($tools->listConcepts()['concepts'])->toHaveCount(2);
    expect($tools->getConcept('composition'))->toContain('Composition documentation.');
});
