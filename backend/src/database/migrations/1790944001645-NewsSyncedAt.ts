import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * NEWS_ARTICLE.synced_at: cuándo la sincronización trajo cada noticia por última vez. Al arrancar,
 * el backend no vuelve a sincronizar si la última fue hace menos de NEWS_SYNC_MINUTES (en Render
 * gratis el servidor se apaga sin visitas y cada arranque gastaría el cupo de Currents).
 */
export class NewsSyncedAt1790944001645 implements MigrationInterface {
    name = 'NewsSyncedAt1790944001645'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "news_articles" ADD "synced_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "news_articles" DROP COLUMN "synced_at"`);
    }

}
