<?php

namespace App\Entity;

use App\Repository\DemoRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Gedmo\Timestampable\Traits\TimestampableEntity;

#[ORM\Entity(repositoryClass: DemoRepository::class)]
class Demo
{
    use TimestampableEntity;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $content = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $iframe_link = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $author = null;

    /**
     * @var Collection<int, Category>
     */
    #[ORM\ManyToMany(targetEntity: Category::class, inversedBy: 'demos')]
    private Collection $categories;

    public function __construct()
    {
        $this->categories = new ArrayCollection();
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

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(?string $content): static
    {
        $this->content = $content;

        return $this;
    }

    public function getIframeLink(): ?string
    {
        return $this->iframe_link;
    }

    public function setIframeLink(string $iframe_link): static
    {
        $this->iframe_link = $iframe_link;

        return $this;
    }

    public function getAuthor(): ?string
    {
        return $this->author;
    }

    public function setAuthor(string $author): static
    {
        $this->author = $author;

        return $this;
    }

    public function __toString(): string
    {
        return $this->title;
    }

    public static function __toArray(Demo $demo): array
    {
        $categories = $demo->getCategories()
            ->map(fn ($category) => $category->getTitle())
            ->toArray();

        return [
            'id' => $demo->id,
            'author' => $demo->author,
            'title' => $demo->title,
            'slug' => implode('', array_map('ucfirst', explode(' ', $demo->title))),
            'content' => $demo->content,
            'iframe_link' => $demo->iframe_link,
            'categories' => $categories,
            'created_at' => $demo->createdAt->format('d/m/Y H:i'),
            'updated_at' => $demo->updatedAt->format('d/m/Y H:i'),
        ];
    }

    /**
     * @return Collection<int, Category>
     */
    public function getCategories(): Collection
    {
        return $this->categories;
    }

    public function addCategory(Category $category): static
    {
        if (!$this->categories->contains($category)) {
            $this->categories->add($category);
        }

        return $this;
    }

    public function removeCategory(Category $category): static
    {
        $this->categories->removeElement($category);

        return $this;
    }
}
