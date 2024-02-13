<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

final class PlayController extends AbstractController
{
    #[Route('/play/', methods: ['GET'])]
    public function index(Request $request): Response
    {
        if ($query = $request->getQueryString()) {
            $query = "#{$query}";
        }

        return $this->redirect("/-/play/{$query}", 301);
    }

    #[Route('/play/__preview', methods: ['GET'])]
    public function preview(Request $request): Response
    {
        return $this->index($request);
    }
}
