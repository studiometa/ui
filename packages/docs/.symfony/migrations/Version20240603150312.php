<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20240603150312 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE demo_category (demo_id INT NOT NULL, category_id INT NOT NULL, INDEX IDX_4E6219F214B61EA (demo_id), INDEX IDX_4E6219F12469DE2 (category_id), PRIMARY KEY(demo_id, category_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE demo_category ADD CONSTRAINT FK_4E6219F214B61EA FOREIGN KEY (demo_id) REFERENCES demo (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE demo_category ADD CONSTRAINT FK_4E6219F12469DE2 FOREIGN KEY (category_id) REFERENCES category (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE demo DROP category_id');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE demo_category DROP FOREIGN KEY FK_4E6219F214B61EA');
        $this->addSql('ALTER TABLE demo_category DROP FOREIGN KEY FK_4E6219F12469DE2');
        $this->addSql('DROP TABLE demo_category');
        $this->addSql('ALTER TABLE demo ADD category_id INT NOT NULL');
    }
}
