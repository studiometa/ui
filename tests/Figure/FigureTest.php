<?php

test('it does not render a lazy image', function () {
    assertTwigMatchesSnapshot("
        {% include '@ui/Figure/Figure.twig' with {
            src: 'https://picsum.photos/400/400',
            width: 400,
            height: 400,
            lazy: false,
        } %}
    ");
});


test('it renders a lazy image by default', function () {
    assertTwigMatchesSnapshot("
        {% include '@ui/Figure/Figure.twig' with {
            src: 'https://picsum.photos/400/400',
            width: 400,
            height: 400,
        } %}
    ");
});

test('it can render a lazy image with fallback', function () {
    assertTwigMatchesSnapshot("
        {% include '@ui/Figure/Figure.twig' with {
            src: 'https://picsum.photos/400/400',
            width: 400,
            height: 400,
            lazy_fallback: true
        } %}
    ");
});
