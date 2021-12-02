<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

final class IndexController extends AbstractController
{
    /**
     * @Route("/", methods={"GET"})
     */
    public function index(Request $request): Response
    {
        $storybookEntrypoint = __DIR__ . '/../../public/.storybook/index.html';

        if (!file_exists($storybookEntrypoint)) {
            return new Response('Missing Storybook files. Did you forgot to build Storybook?');
        }

        return new Response(file_get_contents($storybookEntrypoint));
    }
}
