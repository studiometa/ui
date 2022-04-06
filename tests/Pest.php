<?php

use function Spatie\Snapshots\assertMatchesSnapshot;
use MallardDuck\PrettierPhp\PrettierHtml;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "uses()" function to bind a different classes or traits.
|
*/

// uses(Tests\TestCase::class)->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

// expect()->extend('toBeOne', function () {
//     return $this->toBe(1);
// });

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

class TwigRenderer {
    static $instance;

    protected $twig;

    public function __construct()
    {
        $loader = new \Twig\Loader\FilesystemLoader([__DIR__]);
        $twig = new \Twig\Environment($loader);
        $twig->addExtension(new \Studiometa\Ui\Extension($loader));
        $twig->addExtension(new \Twig\Extension\StringLoaderExtension());
        $this->twig = $twig;
    }
    public static function getInstance() {
        return self::$instance ?? self::$instance = new self();
    }

    public static function render(string $template): string {
        return self::getInstance()->twig->render('render.twig', ['tpl' => $template]);
    }
}

function renderTwig(string $template):string
{
    return PrettierHtml::format(TwigRenderer::render($template));
}


function assertTwigMatchesSnapshot(string $template)
{
    return assertMatchesSnapshot(renderTwig($template));
}
