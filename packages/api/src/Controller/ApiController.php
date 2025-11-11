<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

final class ApiController extends AbstractController
{
    #[Route('/', methods: ['GET', 'POST'], name: 'api')]
    public function index(Request $request): Response
    {
        $query = $request->query;
        $path = $query->get('path');
        $tpl = $request->isMethod('POST') ? $request->request->get('content') ?? $request->getContent() : $request->get('content');

        if (empty($path) && empty($tpl)) {
            die('Nothing to display.');
        }

        if ($request->get('wait')) {
            sleep((int)$request->get('wait'));
        }

        if (!empty($tpl)) {
            return $this->render(
                'render-from-tpl.html.twig',
                array_merge(
                    $query->all(),
                    ['tpl' => $tpl],
                )
            );
        }

        return $this->render($query->get('path'), $query->all());
    }

    #[Route('/source', methods: ['GET'], name: 'api-source')]
    public function source(Request $request): Response
    {
        $query = $request->query;
        $path = $query->get('path');

        if (empty($path)) {
            die('Nothing to display.');
        }

        $file_path =  __DIR__ . '/../../ui/' . $path;

        if (!file_exists($file_path)) {
            die('No file found for "' . $path . '".');
        }

        return new Response(file_get_contents($file_path));
    }
}
