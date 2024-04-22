<?php

namespace App\Controller;

use App\Entity\Demo;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class DemoController extends AbstractController
{
    #[Route('/demo/', name: 'demo_list', methods: ['GET'])]
    public function index(): Response
    {
        return $this->render('demo/index.html.twig', [
            'controller_name' => 'DemoController',
        ]);
    }

    // #[Route('/demo/{id}/edit', name: 'demo_edit', methods: ['GET'])]
    // public function update(EntityManagerInterface $entityManager, int $id): Response
    // {
    //     $demo = $entityManager->getRepository(Demo::class)->find($id);

    //     if (!$demo) {
    //         throw $this->createNotFoundException(
    //             'No demo found for id ' . $id
    //         );
    //     }

    //     $current_date = new \DateTimeImmutable('now', new \DateTimeZone("Europe/Paris"));
    //     $demo->setUpdatedAt($current_date);
    //     $entityManager->flush();
    // }

    // #[Route('/demo/{id}/edit', name: 'demo_edit', methods: ['POST'])]
    // public function update(EntityManagerInterface $entityManager, int $id): Response
    // {
    //     $demo = $entityManager->getRepository(Demo::class)->find($id);

    //     if (!$demo) {
    //         throw $this->createNotFoundException(
    //             'No demo found for id ' . $id
    //         );
    //     }

    //     $current_date = new \DateTimeImmutable('now', new \DateTimeZone("Europe/Paris"));
    //     $demo->setUpdatedAt($current_date);
    //     $entityManager->flush();

    //     return $this->redirectToRoute('demo_list');
    // }
}
