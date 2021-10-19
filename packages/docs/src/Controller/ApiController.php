<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use function PHPUnit\Framework\throwException;

final class ApiController extends AbstractController
{
    /**
     * @Route("/api", name="api", methods={"GET"})
     */
    public function index(Request $request): Response
    {
        $parameters = $request->query->all();

        if (empty($parameters['id'])) {
            throwException('dede');
        }

        $template = ucfirst(explode('-', $parameters['id'])[0]);

        return $this->render("{$template}/{$template}.twig", $request->query->all());
    }

}
