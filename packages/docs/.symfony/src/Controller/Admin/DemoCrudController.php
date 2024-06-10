<?php

namespace App\Controller\Admin;

use App\Entity\Demo;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\NumberField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use Psr\Log\LoggerInterface;
use Symfony\Component\Cache\Adapter\FilesystemAdapter;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class DemoCrudController extends AbstractCrudController
{
    public const COMPILATION_IN_PROGRESS = 'compilation-in-progress';
    private const int COMPILATION_DELAY_IN_SECONDS = 120;

    public static function getEntityFqcn(): string
    {
        return Demo::class;
    }

    public function configureActions(Actions $actions): Actions
    {
        $cache = new FilesystemAdapter();

        $compilationInProgress = $cache->getItem(self::COMPILATION_IN_PROGRESS);

        // If compilation is not in progress, return normal actions
        if (!$compilationInProgress->get()) {
            $compileAction = Action::new('compile', 'Compiler le front-end')
                ->linkToCrudAction('compile')
                ->addCssClass('btn btn-primary')
                ->setIcon('fa fa-brush')
                ->createAsGlobalAction();

            return parent::configureActions($actions)
                ->add(Crud::PAGE_INDEX, $compileAction);
        }

        // Else forbidden create / update / delete and hide compilation button
        return parent::configureActions($actions)
            ->disable(Action::NEW, Action::EDIT, Action::DELETE, Action::BATCH_DELETE);
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Démo')
            ->setEntityLabelInPlural('Démos')
            ->setSearchFields(['title'])
            ->setDefaultSort(['updatedAt' => 'DESC']);
    }

    public function configureFields(string $pageName): iterable
    {
        yield NumberField::new('id')->hideOnForm();
        yield TextField::new('title')->setRequired(true)->setLabel('Titre');
        yield TextEditorField::new('content')->setLabel('Description')
            ->hideOnIndex();
        yield TextareaField::new('iframe_link')->setRequired(true)->setLabel("Lien de l'iFrame")
            ->hideOnIndex();

        if (Crud::PAGE_NEW !== $pageName) {
            $createdAt = DateTimeField::new('createdAt')->setLabel('Créé le');
            yield $createdAt->setDisabled();
        }

        $updatedAt = DateTimeField::new('updatedAt')->setLabel('Dernière modification');
        if (Crud::PAGE_EDIT === $pageName) {
            yield $updatedAt->setDisabled();
        } elseif (Crud::PAGE_NEW !== $pageName) {
            yield $updatedAt;
        }

        yield TextField::new('author')->setLabel('Auteur');

        yield AssociationField::new('categories')
            ->setLabel('Catégories')
            ->setFormTypeOption('choice_label', 'title')
            ->setFormTypeOption('disabled', true);
    }

    public function compile(HttpClientInterface $client, LoggerInterface $logger)
    {
        $this->setCompilationInProgressInCache();

        $response = $client->request('GET', $_ENV['FORGE_WEBHOOK']);

        if ($response->getStatusCode() !== 200) {
            $logger->error('An error occured calling the forge webhook');
            $logger->error($response->getContent());
        }

        return $this->redirect('/admin');
    }

    private function setCompilationInProgressInCache(): void
    {
        $cache = new FilesystemAdapter();

        $compilationInProgress = $cache->getItem(self::COMPILATION_IN_PROGRESS);
        $compilationInProgress->set(true);
        $compilationInProgress->expiresAfter(self::COMPILATION_DELAY_IN_SECONDS);

        $cache->save($compilationInProgress);
    }
}
