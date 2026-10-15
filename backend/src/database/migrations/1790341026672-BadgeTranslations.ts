import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Insignias en inglés y español: el nombre y la descripción originales (en español) se conservan
 * y la traducción va en translations. Solo agrega una columna; la carga `npm run seed`.
 */
export class BadgeTranslations1790341026672 implements MigrationInterface {
    name = 'BadgeTranslations1790341026672'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "badges" ADD "translations" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "badges" DROP COLUMN "translations"`);
    }

}
