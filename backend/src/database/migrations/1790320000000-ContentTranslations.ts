import { MigrationInterface, QueryRunner } from "typeorm";

/** Tablas de contenido que muestran textos al jugador. */
const CONTENT_TABLES = ['games', 'questions', 'fun_facts', 'store_items'];

/**
 * Contenido en inglés y español: cada tabla de contenido guarda sus traducciones en una columna
 * jsonb ({ "es": { ... } }) y la partida guarda el idioma en que se juega. Solo agrega columnas:
 * down las quita y los datos originales no cambian. Las traducciones las carga `npm run seed`.
 */
export class ContentTranslations1790320000000 implements MigrationInterface {
    name = 'ContentTranslations1790320000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const table of CONTENT_TABLES) await queryRunner.query(`ALTER TABLE "${table}" ADD "translations" jsonb`);
        await queryRunner.query(`ALTER TABLE "game_sessions" ADD "locale" character varying(5) NOT NULL DEFAULT 'en'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_sessions" DROP COLUMN "locale"`);
        for (const table of CONTENT_TABLES) await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "translations"`);
    }

}
