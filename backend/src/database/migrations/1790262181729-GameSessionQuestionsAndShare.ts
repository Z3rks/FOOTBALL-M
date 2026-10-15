import { MigrationInterface, QueryRunner } from "typeorm";

export class GameSessionQuestionsAndShare1790262181729 implements MigrationInterface {
    name = 'GameSessionQuestionsAndShare1790262181729'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "games" ADD "sort_order" integer NOT NULL DEFAULT '0'`);
        // Con DEFAULT para que funcione aunque ya existan partidas; luego se quita el default.
        await queryRunner.query(`ALTER TABLE "game_sessions" ADD "question_ids" jsonb NOT NULL DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "game_sessions" ALTER COLUMN "question_ids" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "game_sessions" ADD "shared_at" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_sessions" DROP COLUMN "shared_at"`);
        await queryRunner.query(`ALTER TABLE "game_sessions" DROP COLUMN "question_ids"`);
        await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "sort_order"`);
    }

}
