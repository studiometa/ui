<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

final class ApiController extends AbstractController
{
    /**
     * @Route("/api", name="api", methods={"GET"})
     */
    public function index(Request $request): Response
    {
        $query = $request->query;

        if (empty($query->get('id'))) {
            die('Nothing to display.');
        }

        if (!empty($query->get('tpl'))) {
            return $this->render("@private/render-from-tpl.html.twig", $query->all());
        }

        $template = $query->get('id');
        return $this->render("{$template}/{$template}.twig", $query->all());
    }

}
