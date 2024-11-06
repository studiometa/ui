<?php

namespace App\Entity;

use App\Repository\CategoryRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CategoryRepository::class)]
class Category
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(length: 255, type: 'string')]
    protected ?string $title = null;

    /**
     * @var Collection<int, Demo>
     */
    #[ORM\ManyToMany(targetEntity: Demo::class, mappedBy: 'categories')]
    protected Collection $demos;

    public function __construct()
    {
        $this->demos = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;

        return $this;
    }

    /**
     * @return Collection<int, Category>
     */
    public function getDemos(): Collection
    {
        return $this->demos;
    }

    public function __toString(): string
    {
        return $this->title;
    }
}
