<?php

namespace App\Controller;

use App\Entity\Demo;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

class DemoController extends AbstractController
{
    #[Route('/demos/', name: 'demos_list', methods: ['GET'])]
    public function index(EntityManagerInterface $entityManager): JsonResponse
    {
        $demos = $entityManager->getRepository(Demo::class)->findAll();
        $demos = array_map([Demo::class, '__toArray'], $demos);

        return $this->json($demos);
    }

    #[Route('/api/demos/', name: 'demos_json', methods: ['GET'])]
    public function api_index(EntityManagerInterface $entityManager): JsonResponse
    {
        $demos = $entityManager->getRepository(Demo::class)->findAll();
        $demos = array_map([Demo::class, '__toArray'], $demos);

        return $this->json($demos);
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

    //     return $this->redirectToRoute('demos_list');
    // }
}
