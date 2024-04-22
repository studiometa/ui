<?php

namespace App\Controller\Admin;

use App\Entity\Demo;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\NumberField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;

class DemoCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Demo::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Démo')
            ->setEntityLabelInPlural('Démos')
            ->setSearchFields(['title'])
            ->setDefaultSort(['updatedAt' => 'DESC'])
        ;
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
    }
}
