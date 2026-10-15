import { MigrationInterface, QueryRunner } from "typeorm";

export class BadgeCode1790262813034 implements MigrationInterface {
    name = 'BadgeCode1790262813034'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1) Columna opcional; 2) código de las insignias que ya existen (cargadas por el seed);
        // 3) obligatoria. Así funciona aunque la tabla ya tenga datos.
        await queryRunner.query(`ALTER TABLE "badges" ADD "code" character varying(50)`);
        await queryRunner.query(`UPDATE "badges" SET "code" = CASE "name"
            WHEN 'Primer partido' THEN 'first-game'
            WHEN 'Racha de 7 días' THEN 'streak-7'
            WHEN 'Perfeccionista' THEN 'perfect-game'
            WHEN 'Cazador de retos' THEN 'daily-hunter'
            WHEN 'Todoterreno' THEN 'all-rounder'
            WHEN 'Coleccionista' THEN 'collector'
            WHEN 'Leyenda' THEN 'legend'
            ELSE 'badge-' || "id" END`);
        await queryRunner.query(`ALTER TABLE "badges" ALTER COLUMN "code" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "badges" ADD CONSTRAINT "UQ_48fe47e292737e09162b08c4f7c" UNIQUE ("code")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "badges" DROP CONSTRAINT "UQ_48fe47e292737e09162b08c4f7c"`);
        await queryRunner.query(`ALTER TABLE "badges" DROP COLUMN "code"`);
    }

}
