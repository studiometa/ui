<?php

test('it renders an svg', function () {
    assertTwigMatchesSnapshot("{{ meta_icon('mdi:alert') }}");
});

test('it registers PlayRangeStagger function', function () {
    $result = renderTwig("{{ play_range_stagger(0.1, 4, 0)|json_encode }}");
    expect($result)->toContain('[0,0.7]');
});

test('both functions work with actual loop context', function () {
    $template = "
        {% for index in 1..3 %}
            {% set stagger = play_range_stagger(0.2) %}
            {{ index }}:{{ stagger|json_encode }}
        {% endfor %}
    ";

    $result = renderTwig($template);

    // Should contain results for all 3 items (with actual precision from output)
    expect($result)->toContain('1:[0,0.6]');
    expect($result)->toContain('2:[0.2,0.8]');
    expect($result)->toContain('3:[0.4,1]');
});
