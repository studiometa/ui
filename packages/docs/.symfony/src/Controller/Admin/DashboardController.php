<?php

namespace App\Controller\Admin;

use App\Entity\Category;
use App\Entity\Demo;
use EasyCorp\Bundle\EasyAdminBundle\Config\Dashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\MenuItem;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractDashboardController;
use EasyCorp\Bundle\EasyAdminBundle\Router\AdminUrlGenerator;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class DashboardController extends AbstractDashboardController
{
    #[Route('/admin', name: 'admin')]
    public function index(): Response
    {

        $routeBuilder = $this->container->get(AdminUrlGenerator::class);
        $url = $routeBuilder->setController(DemoCrudController::class)->generateUrl();

        return $this->redirect($url);
    }

    public function configureDashboard(): Dashboard
    {
        return Dashboard::new()
            ->setTitle('Symfony');
    }

    public function configureMenuItems(): iterable
    {
        return [
            MenuItem::linktoRoute('Retourner au site', 'fas fa-home', 'homepage'),
            MenuItem::section('Démos'),
            MenuItem::linkToCrud('Démo', 'fas fa-list', Demo::class),
            MenuItem::linkToCrud('Catégorie', 'fas fa-list', Category::class)
        ];
    }
}
