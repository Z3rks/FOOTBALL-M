import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Noticias en inglés y español: cada noticia guarda su idioma y el feed muestra solo las del
 * idioma del jugador. Las noticias ya guardadas son en inglés (valor por defecto). Las noticias
 * de ejemplo cambian de id (ahora llevan el idioma), así que las viejas se borran; la siguiente
 * sincronización las vuelve a traer en los dos idiomas.
 */
export class NewsLanguage1790335638395 implements MigrationInterface {
    name = 'NewsLanguage1790335638395'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "news_articles" ADD "language" character varying(5) NOT NULL DEFAULT 'en'`);
        await queryRunner.query(`CREATE INDEX "IDX_d2bfe61881315e88d5aafec66f" ON "news_articles" ("language", "category", "published_at") `);
        await queryRunner.query(`DELETE FROM "news_articles" WHERE "external_id" ~ '^sample:[0-9]+$'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Sin la columna, las noticias en español se mezclarían con las demás en el feed.
        await queryRunner.query(`DELETE FROM "news_articles" WHERE "language" <> 'en'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d2bfe61881315e88d5aafec66f"`);
        await queryRunner.query(`ALTER TABLE "news_articles" DROP COLUMN "language"`);
    }

}
