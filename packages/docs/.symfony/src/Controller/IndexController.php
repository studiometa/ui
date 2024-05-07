<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

final class IndexController extends AbstractController
{
    #[Route('/', methods: ['GET'], name: 'homepage')]
    public function index(): Response
    {
        return $this->redirect('/-/', 301);
    }
}
