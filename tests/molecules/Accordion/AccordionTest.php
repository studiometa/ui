<?php

test('it renders an Accordion, default is_open option is set to true, the first item overrides the config to false', function () {
    assertTwigMatchesSnapshot("
        {% set items = [
            {
                title: 'Item #1',
                content: 'lorem lorem',
                attr: {
                    data_option_is_open: false
                }
            },
            {
                title: 'Item #2',
                content: 'lorem lorem',
            },
            {
                title: 'Item #3',
                content: 'lorem lorem'
            },
        ]%}
        {% include '@ui/molecules/Accordion/Accordion.twig' with {
            items: items,
            item_attr: {
                data_option_is_open: true
            }
        } %}
    ");
});
