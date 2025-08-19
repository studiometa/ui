<?php

use Studiometa\Ui\TwigFunctions\PlayRangeStagger;

test('it calculates basic stagger ranges', function () {
    $function = new PlayRangeStagger();
    
    // Test with 4 items, step 0.1 using fallback parameters
    $result1 = $function->run([], 0.1, 4, 0);
    expect(round($result1[0], 10))->toBe(0.0);
    expect(round($result1[1], 10))->toBe(0.7);
    
    $result2 = $function->run([], 0.1, 4, 1);
    expect(round($result2[0], 10))->toBe(0.1);
    expect(round($result2[1], 10))->toBe(0.8);
    
    $result3 = $function->run([], 0.1, 4, 2);
    expect(round($result3[0], 10))->toBe(0.2);
    expect(round($result3[1], 10))->toBe(0.9);
    
    $result4 = $function->run([], 0.1, 4, 3);
    expect(round($result4[0], 10))->toBe(0.3);
    expect(round($result4[1], 10))->toBe(1.0);
});

test('it uses default step of 0.1', function () {
    $function = new PlayRangeStagger();
    
    $result = $function->run([], 0.1, 2, 0);
    expect($result)->toBe([0.0, 0.9]);
    
    $result2 = $function->run([], 0.1, 2, 1);
    expect($result2)->toBe([0.1, 1.0]);
});

test('it handles single item', function () {
    $function = new PlayRangeStagger();
    
    $result = $function->run([], 0.1, 1, 0);
    expect(round($result[0], 1))->toBe(0.0);
    expect(round($result[1], 1))->toBe(1.0);
});

test('it clamps end values to 1', function () {
    $function = new PlayRangeStagger();
    
    // Large step that would cause end > 1
    $result = $function->run([], 0.8, 2, 1);
    expect($result)->toBe([0.8, 1.0]);
});

test('it handles zero duration gracefully', function () {
    $function = new PlayRangeStagger();
    
    // Step so large that duration becomes 0
    $result = $function->run([], 0.3, 5, 0);
    expect(round($result[0], 10))->toBe(0.0);
    expect(round($result[1], 10))->toBe(0.0);
    
    $result2 = $function->run([], 0.3, 5, 4);
    expect(round($result2[0], 10))->toBe(1.2);
    expect(round($result2[1], 10))->toBe(1.0); // Clamped to 1
});

test('it validates step boundaries', function () {
    $function = new PlayRangeStagger();
    
    // Negative step should be clamped to 0
    $result = $function->run([], -0.1, 2, 0);
    expect(round($result[0], 10))->toBe(0.0);
    expect(round($result[1], 10))->toBe(1.0);
    
    // Step > 1 should be clamped to 1
    $result2 = $function->run([], 1.5, 2, 0);
    expect(round($result2[0], 10))->toBe(0.0);
    expect(round($result2[1], 10))->toBe(0.0);
});

test('it handles edge case with zero length', function () {
    $function = new PlayRangeStagger();
    
    $result = $function->run([], 0.1, 0, 0);
    expect(round($result[0], 10))->toBe(0.0);
    expect(round($result[1], 10))->toBe(1.0);
});

test('it throws exception for invalid loop context', function () {
    $function = new PlayRangeStagger();
    
    expect(fn() => $function->run([], 0.1))
        ->toThrow(\Exception::class, 'Could not infer loop from the current Twig context, provide `length` and `index` parameter.');
    
    expect(fn() => $function->run(['loop' => ['length' => 4]], 0.1))
        ->toThrow(\Exception::class, 'Could not infer loop from the current Twig context, provide `length` and `index` parameter.');
    
    expect(fn() => $function->run(['loop' => ['index0' => 0]], 0.1))
        ->toThrow(\Exception::class, 'Could not infer loop from the current Twig context, provide `length` and `index` parameter.');
});

test('it works with different step values', function () {
    $function = new PlayRangeStagger();
    
    // Smaller step = more overlap
    $result = $function->run([], 0.05, 3, 0);
    expect($result)->toBe([0.0, 0.9]);
    
    // Larger step = less overlap
    $result2 = $function->run([], 0.2, 3, 0);
    expect($result2)->toBe([0.0, 0.6]);
});

test('it handles fractional calculations precisely', function () {
    $function = new PlayRangeStagger();
    
    // Test precise floating point calculations
    $result = $function->run([], 0.15, 3, 1);
    expect($result[0])->toBe(0.15);
    expect($result[1])->toBe(0.85); // 0.15 + (1 - 0.15 * 2)
});

test('it works with fallback parameters when no loop context', function () {
    $function = new PlayRangeStagger();

    // Test with fallback parameters
    $result1 = $function->run([], 0.1, 4, 0);
    expect(round($result1[0], 10))->toBe(0.0);
    expect(round($result1[1], 10))->toBe(0.7);

    $result2 = $function->run([], 0.1, 4, 1);
    expect(round($result2[0], 10))->toBe(0.1);
    expect(round($result2[1], 10))->toBe(0.8);

    $result3 = $function->run([], 0.1, 4, 2);
    expect(round($result3[0], 10))->toBe(0.2);
    expect(round($result3[1], 10))->toBe(0.9);

    $result4 = $function->run([], 0.1, 4, 3);
    expect(round($result4[0], 10))->toBe(0.3);
    expect(round($result4[1], 10))->toBe(1.0);
});

test('it prefers fallback parameters over loop context', function () {
    $function = new PlayRangeStagger();

    // Fallback parameters should be used even when context is provided
    $result = $function->run(['_key' => 5, '_seq' => range(0, 9)], 0.2, 2, 0);
    expect($result[0])->toBe(0.0);
    expect($result[1])->toBe(0.8); // Based on fallback parameters: length=2, index=0, not context values
});

test('it throws exception when neither loop context nor fallback parameters are complete', function () {
    $function = new PlayRangeStagger();

    // Missing index parameter
    expect(fn() => $function->run([], 0.1, 4))
        ->toThrow(\Exception::class, 'Could not infer loop from the current Twig context, provide `length` and `index` parameter.');

    // Missing length parameter
    expect(fn() => $function->run([], 0.1, null, 2))
        ->toThrow(\Exception::class, 'Could not infer loop from the current Twig context, provide `length` and `index` parameter.');
});
