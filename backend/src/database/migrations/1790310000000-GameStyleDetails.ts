import { MigrationInterface, QueryRunner } from "typeorm";

/** Minijuegos que pasan a tener su propio estilo (Timeline ya lo tiene desde la migración anterior). */
const STYLED_GAMES = `'who-is-it', 'silhouette', 'guess-the-badge', 'guess-the-stadium', 'connections', 'the-transfer', 'how-much-was-he-worth', 'dream-team', 'goal-or-no-goal'`;

/**
 * Cada minijuego tiene su propio estilo: QUESTION.details guarda los datos públicos que usa cada
 * estilo para dibujar la pregunta (pistas, colores del escudo, trayectoria, alineación…). Las
 * preguntas viejas de estos minijuegos se retiran junto con sus respuestas; las nuevas las carga
 * `npm run seed`. down retira las preguntas con estilo y la columna, para volver al código
 * anterior y restaurar las preguntas viejas con `npm run seed`.
 */
export class GameStyleDetails1790310000000 implements MigrationInterface {
    name = 'GameStyleDetails1790310000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" ADD "details" jsonb`);
        await this.retireQuestions(queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.retireQuestions(queryRunner);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "details"`);
    }

    private async retireQuestions(queryRunner: QueryRunner): Promise<void> {
        const games = `SELECT id FROM "games" WHERE strategy_key IN (${STYLED_GAMES})`;
        await queryRunner.query(`UPDATE "game_sessions" SET "status" = 'abandoned' WHERE "status" = 'in_progress' AND "game_id" IN (${games})`);
        await queryRunner.query(`DELETE FROM "game_answers" WHERE "question_id" IN (SELECT id FROM "questions" WHERE "game_id" IN (${games}))`);
        await queryRunner.query(`DELETE FROM "questions" WHERE "game_id" IN (${games})`);
    }

}
