<?php

test('it renders an accessible Disclosure group', function () {
    assertTwigMatchesSnapshot("
        {% include '@ui/Disclosure/Disclosure.twig' with {
            id: 'faq',
            heading_tag: 'h2',
            attr: {
                data_option_no_multiple: true,
                data_option_no_collapsible: true
            },
            items: [
                {
                    title: 'Shipping',
                    content: 'Shipping information',
                    open: true,
                    panel_attr: { role: 'region' }
                },
                {
                    id: 'returns',
                    title: 'Returns',
                    content: 'Returns information',
                    disabled: true
                }
            ]
        } %}
    ");
});
