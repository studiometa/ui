<?php

test('it renders an svg', function () {
    assertTwigMatchesSnapshot("{{ meta_icon('mdi', 'alert') }}");
});
