<?php

test('it does not render a lazy image', function () {
    assertTwigMatchesSnapshot("
        {% include '@ui/Figure/FigureTwicpics.twig' with {
            src: '/uploads/image.jpg',
            width: 400,
            height: 400,
            lazy: false,
            twic_domain: 'test.twic.pics',
            twic_path: 'path'
        } %}
    ");
});


test('it renders a lazy image by default', function () {
    assertTwigMatchesSnapshot("
        {% include '@ui/Figure/FigureTwicpics.twig' with {
            src: '/uploads/image.jpg',
            width: 400,
            height: 400,
            twic_domain: 'test.twic.pics',
            twic_path: 'path'
        } %}
    ");
});

test('it can render TwicPics placeholders', function () {
    assertTwigMatchesSnapshot("
        {% include '@ui/Figure/FigureTwicpics.twig' with {
            src: '/uploads/image.jpg',
            width: 400,
            height: 400,
            twic_domain: 'test.twic.pics',
            twic_path: 'path',
            twic_placeholder: 'preview'
        } %}
    ");
});

test('it can render advanced TwicPics placeholders', function () {
    assertTwigMatchesSnapshot("
        {% include '@ui/Figure/FigureTwicpics.twig' with {
            src: '/uploads/image.jpg',
            width: 400,
            height: 400,
            twic_domain: 'test.twic.pics',
            twic_path: 'path',
            twic_placeholder: {
                quality_max: 1,
            },
        } %}
    ");
});
