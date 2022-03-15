<?php

test('it renders a button', function () {
    assertTwigMatchesSnapshot("
        {% include '@ui/atoms/Button/Button.twig' with {
            label: 'Label',
            attr: {
                class: 'py-4'
            }
        } %}
    ");
});

test('it renders a link', function () {
    assertTwigMatchesSnapshot("
        {% include '@ui/atoms/Button/Button.twig' with {
            label: 'Label',
            href: '#',
        } %}
    ");
});

test('it renders a button with type submit', function () {
    assertTwigMatchesSnapshot("
{% include '@ui/atoms/Button/Button.twig' with {
    label: 'Label',
    attr: { type: 'submit' },
} %}
    ");
});
